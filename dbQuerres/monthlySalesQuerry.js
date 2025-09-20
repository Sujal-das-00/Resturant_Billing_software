import  Sale  from '../models/sales.js';
export async function getMonthlyTotal() {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const result = await Sale.aggregate([
            {
                $match: {
                    year: currentYear,
                    month: currentMonth,
                },
            },
            {
                $group: {
                    _id: null,
                    MonthlyTotal: { $sum: '$Total_bill' },
                },
            },
        ]);
        if (result.length > 0) {
            return result[0].MonthlyTotal;
        } else {
            return 0;
        }
    }
    catch (error) {
        console.log("error occured in monthly fetching",error);
    }
}