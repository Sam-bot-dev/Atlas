# Analytics Excel Import Guide

## Overview
Upload an Excel or CSV file to update all business metrics at once. This feature allows you to import data for revenue, growth rates, orders, and customer information across multiple businesses.

## File Format

### Supported File Types
- `.xlsx` - Microsoft Excel (recommended)
- `.xls` - Microsoft Excel 97-2003
- `.csv` - Comma-separated values

### Column Headers (Required)
Your Excel file must have the following columns in the first row:

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| **Business Name** | Text | Name of the business | "Your Bakery" |
| **Revenue** | Number | Total revenue amount | 50000 |
| **Revenue Growth** | Number | Growth percentage (%) | 12.5 |
| **Orders** | Number | Number of orders | 450 |
| **Customers** | Number | Total customer count | 320 |
| **Customer Growth** | Number | Customer growth percentage (%) | 8.3 |

### Important Notes
- ✅ Use the first row for column headers
- ✅ All columns are optional except "Business Name" (for identification)
- ✅ Numbers should not include currency symbols
- ✅ Growth rates should be entered as percentages (e.g., 12.5 for 12.5%)
- ✅ One business per row

## Example Data

```
Business Name,Revenue,Revenue Growth,Orders,Customers,Customer Growth
Your Bakery,50000,12.5,450,320,8.3
Coffee Shop,75000,18.2,680,510,14.5
Retail Store,120000,22.1,1200,890,16.8
Online Store,200000,15.3,2500,1850,12.4
Service Business,95000,25.6,520,410,19.2
```

## How to Use

### Step 1: Download Template
Click the **"Template"** button in the Analytics section to download the pre-formatted CSV file.

### Step 2: Fill in Your Data
Edit the downloaded file in Excel or Google Sheets:
1. Keep the header row unchanged
2. Add your business data in rows below
3. Fill in the metrics for each business

### Step 3: Upload File
1. Click **"Upload Excel"** button
2. Select your prepared file
3. Wait for confirmation message

### Step 4: View Updates
Your analytics dashboard will automatically refresh with the new data.

## Troubleshooting

### "File format not supported"
- Ensure you're using .xlsx, .xls, or .csv format
- Check that the file is not corrupted

### "Header row is missing"
- The first row must contain column headers
- Column names are case-insensitive but must match the format above

### "No data was updated"
- Check that you have at least one data row below the header
- Verify that numeric fields contain valid numbers
- Ensure business names are not empty

## Tips for Best Results

1. **Keep headers consistent** - Don't modify column names
2. **Remove empty rows** - Delete any blank rows at the end of the data
3. **Format numbers correctly**:
   - Revenue: 50000 (not 50,000)
   - Growth: 12.5 (not 12.5%)
4. **Use valid data** - Negative numbers are allowed for declining metrics
5. **Test with small batch** - Start with 2-3 rows before importing all data

## Data Requirements

- **Revenue**: Positive number (total revenue amount)
- **Orders**: Positive integer (number of transactions)
- **Customers**: Positive integer (total unique customers)
- **Growth metrics**: Can be positive or negative (percentage change)
  - Positive: 15.5 (15.5% growth)
  - Negative: -5.2 (5.2% decline)

## Security & Privacy

- ✅ Files are processed securely
- ✅ Data is encrypted in transit
- ✅ Only you can see your business metrics
- ✅ Files are deleted after processing

## Questions?

For more help with importing metrics or questions about the file format, please contact support or check the documentation.
