# Vocabulary Import Guide

## How to Import Vocabulary from CSV File

### Step 1: Prepare Your CSV File

Create a CSV file with the following columns:

- **word** - Japanese word/kanji
- **reading** - Hiragana reading
- **meaning** - Vietnamese or English meaning
- **category** - Category/topic (optional)
- **level** - JLPT level 1-4 (optional, default: 2)
- **example_sentence** - Example usage (optional)

### Step 2: CSV Format Example

```
word,reading,meaning,category,level,example_sentence
学ぶ,まなぶ,learn,Verbs,2,
日本,にほん,Japan,Geography,1,
勉強,べんきょう,study,Nouns,2,
```

### Step 3: Import in Admin Panel

1. Go to **Admin > Manage Vocabulary**
2. Click the **"Import CSV"** button
3. Click **"Download Template"** to get a template file
4. Fill in your vocabulary items
5. Upload your CSV file
6. Wait for the import to complete

### Important Notes:

- **Required fields**: word, reading, meaning
- **Duplicate protection**: Words with identical word+reading won't be re-imported
- **Max batch size**: No limit, import as many words as needed
- **Error handling**: If a row has errors, it will be skipped, but others will still import

### CSV Encoding:

- **Encoding**: UTF-8 (to support Japanese characters)
- **Delimiter**: Comma (,)
- **Line endings**: Unix (LF) or Windows (CRLF)

### Sample Data Provided

A sample file `vocabulary_sample.csv` is included with 30+ common Japanese vocabulary words you can modify and import.

---

Generated: 2026-04-04
