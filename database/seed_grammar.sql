-- Seed file for grammar points

-- Clear existing related data to prevent duplicates on re-run
DELETE FROM grammar_examples;
DELETE FROM grammar;

-- 1. ～以上 (～いじょう)
DO $$
DECLARE
  grammar_id_1 INT;
BEGIN
    INSERT INTO grammar
        (pattern, title, meaning, explanation, level, category, quick_tip)
    VALUES
        (
            '～以上',
            'Một khi đã... thì phải...',
            'Diễn tả ý nghĩa "một khi đã ở trong tình huống A, thì đương nhiên/phải làm B". Thể hiện quyết tâm, nghĩa vụ, hoặc một kết quả tất yếu.',
            'Đi sau động từ ở thể thông thường (Vる, Vた). Mệnh đề sau thường biểu thị ý chí, mệnh lệnh, hoặc một suy luận hợp lý. Mang sắc thái trang trọng, thường dùng trong văn viết hoặc các tình huống cần sự quyết đoán.',
            2,
            'Điều kiện',
            'Nhấn mạnh kết quả tất yếu hoặc trách nhiệm phải thực hiện khi một điều kiện đã xảy ra.'
  )
    RETURNING id INTO grammar_id_1;

INSERT INTO grammar_examples
    (grammar_id, sentence, translation)
VALUES
    ( grammar_id_1, '約束した以上、必ず守ります。', 'Một khi đã hứa thì tôi nhất định sẽ giữ lời.'),
    ( grammar_id_1, '試験を受ける以上、合格したい。', 'Một khi đã dự thi thì tôi muốn đỗ.'),
    ( grammar_id_1, 'チームのリーダーである以上、メンバーの意見を尊重すべきだ。', 'Trên cương vị là trưởng nhóm, tôi phải tôn trọng ý kiến của các thành viên.');
END $$;

-- 2. ～末（に） (～すえに)
DO $$
DECLARE
  grammar_id_2 INT;
BEGIN
    INSERT INTO grammar
        (pattern, title, meaning, explanation, level, category, quick_tip)
    VALUES
        (
            '～末（に）',
            'Sau một thời gian dài..., cuối cùng...',
            'Diễn tả một kết quả có được sau khi đã trải qua một quá trình, một khoảng thời gian dài với nhiều nỗ lực, khó khăn hoặc cân nhắc.',
            'Thường đi với danh từ + の hoặc động từ ở thể Ta (Vた). Kết quả ở mệnh đề sau có thể tốt hoặc xấu. Nhấn mạnh vào quá trình kéo dài trước khi đi đến kết quả cuối cùng.',
            2,
            'Thời gian',
            'Dùng khi muốn nói "sau rất nhiều..." hoặc "sau khi suy nghĩ kỹ...".'
  )
    RETURNING id INTO grammar_id_2;

INSERT INTO grammar_examples
    (grammar_id, sentence, translation)
VALUES
    ( grammar_id_2, '長い議論の末に、やっと結論が出た。', 'Sau một cuộc tranh luận dài, cuối cùng cũng đưa ra được kết luận.'),
    ( grammar_id_2, '色々悩んだ末、彼と別れることにした。', 'Sau rất nhiều trăn trở, tôi đã quyết định chia tay anh ấy.'),
    ( grammar_id_2, '数時間にわたる手術の末、彼の命は助かった。', 'Sau ca phẫu thuật kéo dài nhiều giờ, tính mạng của anh ấy đã được cứu.');
END $$;

-- 3. ～ものだから
DO $$
DECLARE
  grammar_id_3 INT;
BEGIN
    INSERT INTO grammar
        (pattern, title, meaning, explanation, level, category, quick_tip)
    VALUES
        (
            '～ものだから',
            'Vì... (nên mới...)',
            'Dùng để trình bày lý do, biện minh cho một hành động hoặc một tình huống nào đó. Thường mang sắc thái cá nhân, giải thích cho một việc đã xảy ra.',
            'Đi sau động từ, tính từ, danh từ ở thể thông thường (Na/N + な). Thường dùng trong văn nói, mang tính phân trần, giải thích. Không dùng để ra lệnh hay yêu cầu.',
            2,
            'Lý do',
            'Sử dụng khi muốn nói "thực ra là vì..." để người nghe thông cảm.'
  )
    RETURNING id INTO grammar_id_3;

INSERT INTO grammar_examples
    (grammar_id, sentence, translation)
VALUES
    ( grammar_id_3, '事故があったものだから、電車が遅れてしまったんです。', 'Là vì có tai nạn nên tàu điện mới bị trễ đấy ạ.'),
    ( grammar_id_3, '昨日はとても疲れていたものだから、宿題をせずに寝てしまった。', 'Vì hôm qua mệt quá nên tôi đã đi ngủ mà không làm bài tập.'),
    ( grammar_id_3, '日本の習慣を知らなかったものですから、失礼なことをしてしまいました。', 'Vì không biết tập quán của Nhật Bản nên tôi đã có hành động thất lễ.');
END $$;
