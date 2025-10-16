import Sales from '../models/sales.js';

export const getDailyChartData = async (year, month) => {
  // Validate input
  if (!year || !month || month < 1 || month > 12) {
    throw new Error('Invalid year or month provided.');
  }

  // Get the number of days in the specified month
  const daysInMonth = new Date(year, month, 0).getDate();

  try {
    const dbResults = await Sales.aggregate([
      {
        // Stage 1: Match documents for the correct month and year
        $match: {
          year: parseInt(year),
          month: parseInt(month),
        },
      },
      {
        // Stage 2: Group by the 'day' field
        $group: {
          _id: '$day', // Group by the day number
          totalSales: { $sum: '$Total_bill' }, // Sum the sales for that day
        },
      },
      {
        // Stage 3: Sort the results by day
        $sort: { _id: 1 },
      },
    ]);

    // Initialize an array with zeros, one for each day of the month
    let dailyTotals = new Array(daysInMonth).fill(0);

    // Populate the array with the results from the database
    dbResults.forEach((result) => {
      // The day number (_id) is used to find the correct array index
      // Subtract 1 because arrays are 0-indexed (day 1 -> index 0)
      if (result._id <= daysInMonth) {
        dailyTotals[result._id - 1] = result.totalSales;
      }
    });

    return dailyTotals;
  } catch (error) {
    console.error('Error fetching daily sales data:', error);
    return new Array(daysInMonth).fill(0);
  }
};