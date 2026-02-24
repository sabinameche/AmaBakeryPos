for main dashboard tab

link: http://127.0.0.1:8000/api/calculate/dashboard-details/1/ for admin,superadmin
link: http://127.0.0.1:8000/api/calculate/dashboard-details/ for branch manager

get method only
response on postman
{
    "success": true,
    "today_sales": 4600.0,
    "sales_percent": -89.70456580125335,
    "total_orders": 5,
    "order_percent": -81.48148148148148,
    "peak_hours": [
        "01:00 PM"
    ],
    "total_sales_per_category": [
        {
            "product__category__name": "cake",
            "category_total_sales": 47200.0
        }
    ],
    "top_selling_items": [
        {
            "product__name": "butter scotch cake",
            "total_orders": 57
        },
        {
            "product__name": "tiramisu",
            "total_orders": 49
        },
        {
            "product__name": "black forest cake",
            "total_orders": 29
        }
    ]
}

for reports tab
link: http://127.0.0.1:8000/api/calculate/report-dashboard/1/ for admin,superadmin
link: http://127.0.0.1:8000/api/calculate/report-dashboard/ for branch manager

get method only

response on postman
{
    "success": true,
    "total_month_sales": 49280.0,
    "total_month_orders": 32,
    "growth_percent": 49280.0
}