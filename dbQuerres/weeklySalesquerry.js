import Sales from '../models/sales.js'; 

export const getWeeklyChartData = async (year, month) => {
  // Validate input
  if (!year || !month || month < 1 || month > 12) {
    throw new Error('Invalid year or month provided.');
  }
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const daysInMonth = endDate.getDate();
  const numWeeks = Math.ceil(daysInMonth / 7);

  
try {
  const dbResults = await Sales.aggregate([
    {
      $match: {
        year: parseInt(year), // Ensure year is a number
        month: parseInt(month), // Ensure month is a number
      },
    },
    {
      $group: {
        _id: {
          $floor: {
            $divide: [{ $subtract: ['$day', 1] }, 7]
          },
        },
        totalSales: { $sum: '$Total_bill' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
    let weeklyTotals = new Array(numWeeks).fill(0);
    dbResults.forEach((result) => {
      if (result._id < numWeeks) {
        weeklyTotals[result._id] = result.totalSales;
      }
    });

    return weeklyTotals;
  } catch (error) {
    console.error('Error fetching weekly sales data:', error);
    return new Array(numWeeks).fill(0);
  }
};