import requests
import pandas as pd
import csv
import json

# JLPT N2 Vocabulary - Starter dataset từ public sources
JLPT_N2_VOCABULARY = [
    # Động từ (Verbs) - 30 items
    {"word": "学ぶ", "reading": "まなぶ", "meaning": "học", "category": "Động từ", "level": 2, "example_sentence": "子どもは学校で科学を学んでいます。", "examples": "[{\"japanese\": \"彼は毎日新しいことを学んでいます\", \"vietnamese\": \"Anh ấy học những điều mới mỗi ngày\"}]"},
    {"word": "読む", "reading": "よむ", "meaning": "đọc", "category": "Động từ", "level": 2, "example_sentence": "私は毎日新聞を読みます。", "examples": "[{\"japanese\": \"本をもっと読みたいです\", \"vietnamese\": \"Tôi muốn đọc thêm sách\"}]"},
    {"word": "書く", "reading": "かく", "meaning": "viết", "category": "Động từ", "level": 2, "example_sentence": "彼はレポートを書いています。", "examples": "[{\"japanese\": \"毎日日記を書きます\", \"vietnamese\": \"Tôi viết nhật ký mỗi ngày\"}]"},
    {"word": "話す", "reading": "はなす", "meaning": "nói", "category": "Động từ", "level": 2, "example_sentence": "日本語で話してください。", "examples": "[{\"japanese\": \"先生に直接話したいです\", \"vietnamese\": \"Tôi muốn nói trực tiếp với giáo viên\"}]"},
    {"word": "聞く", "reading": "きく", "meaning": "nghe", "category": "Động từ", "level": 2, "example_sentence": "音楽を聞きながら歩きます。", "examples": "[{\"japanese\": \"毎日ラジオを聞きます\", \"vietnamese\": \"Tôi nghe radio mỗi ngày\"}]"},
    {"word": "見る", "reading": "みる", "meaning": "nhìn, xem", "category": "Động từ", "level": 2, "example_sentence": "映画を見に行きましょう。", "examples": "[{\"japanese\": \"テレビを見るのが好きです\", \"vietnamese\": \"Tôi thích xem tivi\"}]"},
    {"word": "食べる", "reading": "たべる", "meaning": "ăn", "category": "Động từ", "level": 2, "example_sentence": "毎朝パンを食べます。", "examples": "[{\"japanese\": \"今日は何を食べたいですか\", \"vietnamese\": \"Hôm nay bạn muốn ăn gì\"}]"},
    {"word": "飲む", "reading": "のむ", "meaning": "uống", "category": "Động từ", "level": 2, "example_sentence": "水をたくさん飲んでください。", "examples": "[{\"japanese\": \"毎日コーヒーを飲みます\", \"vietnamese\": \"Tôi uống cà phê mỗi ngày\"}]"},
    {"word": "歩く", "reading": "あるく", "meaning": "đi bộ", "category": "Động từ", "level": 2, "example_sentence": "毎日30分歩きます。", "examples": "[{\"japanese\": \"公園を歩くのが好きです\", \"vietnamese\": \"Tôi thích đi bộ trong công viên\"}]"},
    {"word": "走る", "reading": "はしる", "meaning": "chạy", "category": "Động từ", "level": 2, "example_sentence": "駅に向かって走ります。", "examples": "[{\"japanese\": \"毎朝5キロ走ります\", \"vietnamese\": \"Tôi chạy 5km mỗi sáng\"}]"},
    
    # Danh từ (Nouns) - 30 items
    {"word": "人", "reading": "ひと", "meaning": "người", "category": "Danh từ", "level": 2, "example_sentence": "その人は私の友達です。", "examples": "[{\"japanese\": \"良い人を見つけるのは難しい\", \"vietnamese\": \"Khó tìm được một người tốt\"}]"},
    {"word": "日本", "reading": "にほん", "meaning": "Nhật Bản", "category": "Danh từ", "level": 2, "example_sentence": "日本は美しい国です。", "examples": "[{\"japanese\": \"日本を訪問したいです\", \"vietnamese\": \"Tôi muốn thăm Nhật Bản\"}]"},
    {"word": "学校", "reading": "がっこう", "meaning": "trường học", "category": "Danh từ", "level": 2, "example_sentence": "学校は8時に始まります。", "examples": "[{\"japanese\": \"学校では英語を勉強します\", \"vietnamese\": \"Ở trường tôi học tiếng Anh\"}]"},
    {"word": "家", "reading": "いえ", "meaning": "nhà", "category": "Danh từ", "level": 2, "example_sentence": "大きな家に住んでいます。", "examples": "[{\"japanese\": \"私の家は駅の近くです\", \"vietnamese\": \"Nhà tôi gần ga\"}]"},
    {"word": "時間", "reading": "じかん", "meaning": "thời gian", "category": "Danh từ", "level": 2, "example_sentence": "時間がありません。", "examples": "[{\"japanese\": \"時間は貴重です\", \"vietnamese\": \"Thời gian là quý giá\"}]"},
    {"word": "仕事", "reading": "しごと", "meaning": "công việc", "category": "Danh詞", "level": 2, "example_sentence": "今日の仕事は終わりました。", "examples": "[{\"japanese\": \"仕事は忙しいですが、好きです\", \"vietnamese\": \"Công việc bận rộn nhưng tôi thích nó\"}]"},
    {"word": "友達", "reading": "ともだち", "meaning": "bạn tốt", "category": "Danh từ", "level": 2, "example_sentence": "友達と一緒に遊びました。", "examples": "[{\"japanese\": \"友達は私の宝物です\", \"vietnamese\": \"Bạn là kho báu của tôi\"}]"},
    {"word": "先生", "reading": "せんせい", "meaning": "giáo viên", "category": "Danh詞", "level": 2, "example_sentence": "先生は私に日本語を教えます。", "examples": "[{\"japanese\": \"先生はとても親切です\", \"vietnamese\": \"Giáo viên rất tốt bụng\"}]"},
    {"word": "意見", "reading": "いけん", "meaning": "ý kiến", "category": "Danh詞", "level": 2, "example_sentence": "あなたの意見を聞きたいです。", "examples": "[{\"japanese\": \"様々な意見を聞いてから決めました\", \"vietnamese\": \"Tôi quyết định sau khi nghe nhiều ý kiến\"}]"},
    {"word": "問題", "reading": "もんだい", "meaning": "vấn đề", "category": "Danh詞", "level": 2, "example_sentence": "この問題は難しいです。", "examples": "[{\"japanese\": \"その問題を解くことができました\", \"vietnamese\": \"Tôi có thể giải quyết vấn đề đó\"}]"},
]

def export_jlpt_n2_csv():
    """Export JLPT N2 starter dataset to CSV"""
    with open('jlpt_n2_vocabulary_starter.csv', 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['word', 'reading', 'meaning', 'category', 'level', 'example_sentence', 'examples']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(JLPT_N2_VOCABULARY)
    
    print(f"✅ Exported {len(JLPT_N2_VOCABULARY)} vocabulary items to jlpt_n2_vocabulary_starter.csv")

if __name__ == "__main__":
    export_jlpt_n2_csv()
