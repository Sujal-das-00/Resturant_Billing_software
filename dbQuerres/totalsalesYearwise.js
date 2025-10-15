import Sales from '../models/sales.js'; 

/**
 * Fetches and processes monthly sales data for a given year.
 * @param {number} year
 * @returns {Promise<number[]>}
 */


export const getMonthlyChartData = async (year) => {
  const dbResults = await Sales.aggregate([
    { $match: { year: year } },
    {
      $group: {
        _id: '$month',
        totalSales: { $sum: '$Total_bill' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  let monthlyTotals = new Array(12).fill(0);

  dbResults.forEach((result) => {
    const monthIndex = result._id - 1;
    monthlyTotals[monthIndex] = result.totalSales;
  });

  return monthlyTotals;
};