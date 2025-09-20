import Sale  from '../models/sales.js';

export async function getTodaysTotal() {
  try {
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JS months are 0-11
    const currentDay = now.getDate();

    
    const result = await Sale.aggregate([
      {
        $match: {
          year: currentYear,
          month: currentMonth,
          day: currentDay,
        },
      },
      {
        $group: {
          _id: null,
          todaysTotal: { $sum: '$Total_bill' },
        },
      },
    ]);
    if (result.length > 0) {
      return result[0].todaysTotal;
    } else {
      return 0;
    }
  } catch (error) {
    console.error("Error fetching today's total sales:", error);
    throw error;
  }
}
