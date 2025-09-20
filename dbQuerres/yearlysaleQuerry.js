import  Sale from "../models/sales.js";

export async function getYearlyTotal() {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();

        const result = await Sale.aggregate([
            {
                $match: {
                    year: currentYear,
                },
            },
            {
                $group: {
                    _id: null,
                    yearlyTotal: { $sum: '$Total_bill' },
                },
            },
        ]);
        if (result.length > 0) {
            return result[0].yearlyTotal;
        } else {
            return 0;
        }
    }
    catch (error) {
        console.log("error occured in monthly fetching",error);
    }
}