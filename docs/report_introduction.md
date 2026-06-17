# DANH MỤC CÁC TỪ VIẾT TẮT

| Chữ viết tắt | Từ ngữ |
| :--- | :--- |
| AI | Trí tuệ nhân tạo |
| LLM | Mô hình ngôn ngữ lớn |
| RAG | Retrieval-Augmented Generation |
| LPU | Language Processing Unit |
| SM-2 | SuperMemo-2 |
| JLPT | Japanese-Language Proficiency Test |
| BrSE | Bridge Software Engineer |
| IT Comtor | IT Communicator |
| CNTT | Công nghệ thông tin |
| SPA | Single Page Application |
| DOM | Document Object Model |
| JSX | JavaScript XML |
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| CSV | Comma-Separated Values |
| RAM | Random Access Memory |
| GPU | Graphics Processing Unit |
| SQL | Structured Query Language |
| HTML | HyperText Markup Language |
| CSS | Cascading Style Sheets |
| UI | User Interface |
| URL | Uniform Resource Locator |
| JSON | JavaScript Object Notation |
| JWT | JSON Web Token |
| HTTP | Hypertext Transfer Protocol |
| REST | Representational State Transfer |
| DBMS | Database Management System |

---

# MỞ ĐẦU

## 1. Mục đích thực hiện đề tài

Trong bối cảnh toàn cầu hóa và hội nhập kinh tế quốc tế sâu rộng, mối quan hệ hợp tác chiến lược giữa Việt Nam và Nhật Bản ngày càng phát triển mạnh mẽ trên nhiều lĩnh vực, từ kinh tế, thương mại đến trao đổi nguồn nhân lực chất lượng cao. Đặc biệt, nhu cầu về nhân sự ngành Công nghệ thông tin (CNTT) có năng lực tiếng Nhật (như Kỹ sư cầu nối - BrSE, điều phối viên dự án - IT Comtor) liên tục tăng trưởng đột biến. Trình độ tiếng Nhật N2 (JLPT N2) được coi là tiêu chuẩn vàng, là điều kiện tiên quyết để các kỹ sư và cử nhân Việt Nam có thể làm việc trực tiếp, đàm phán và quản lý dự án với các đối tác Nhật Bản.

Tuy nhiên, việc đạt được và duy trì trình độ tiếng Nhật N2 là một thách thức lớn đối với người học tại Việt Nam. Phương pháp học tập truyền thống tại các trung tâm ngoại ngữ hay qua giáo trình giấy thường tập trung nhiều vào lý thuyết, chuẩn bị cho các kỳ thi trắc nghiệm đọc hiểu và nghe hiểu, dẫn đến tình trạng "lệch kỹ năng". Học viên có thể thi đỗ chứng chỉ N2 nhưng lại thiếu tự tin, gặp khó khăn lớn trong việc giao tiếp thực tế (Kaiwa), phản xạ chậm và thường xuyên mắc các lỗi ngữ pháp cơ bản hoặc sử dụng từ vựng không phù hợp với văn phong công sở chuyên nghiệp của Nhật Bản. Hơn nữa, việc tìm kiếm môi trường luyện nói bản xứ hàng ngày đòi hỏi chi phí rất lớn và không linh hoạt về mặt thời gian.

Sự bùng nổ của Trí tuệ nhân tạo (AI) và các Mô hình ngôn ngữ lớn (LLM) trong những năm gần đây đã mở ra những hướng đi mang tính đột phá cho giáo dục số. Đề tài **"Hệ thống hỗ trợ học tiếng Nhật N2 tích hợp chatbot AI và thuật toán lặp lại ngắt quãng"** được thực hiện nhằm mục đích giải quyết triệt để các hạn chế trên. Hệ thống hướng tới việc xây dựng một môi trường tự học thông minh, toàn diện, hoạt động 24/7. Bằng cách kết hợp giữa quản lý bài học truyền thống, thuật toán ghi nhớ dài hạn tối ưu và trợ lý AI hội thoại siêu tốc có khả năng sửa lỗi thời gian thực, đề tài tạo ra một công cụ hỗ trợ đắc lực giúp người học thu hẹp khoảng cách giữa lý thuyết học thuật và phản xạ giao tiếp thực tế trong công việc.

---

## 2. Mục tiêu đề tài

Để đạt được mục đích đề ra, đề tài xác định rõ các mục tiêu cụ thể về mặt nghiên cứu lý thuyết lẫn ứng dụng thực tiễn như sau:

### 2.1. Mục tiêu lý thuyết
- Nghiên cứu cơ sở khoa học của thuật toán lặp lại ngắt quãng (Spaced Repetition Algorithm - điển hình là thuật toán SuperMemo-2) nhằm tối ưu hóa khả năng ghi nhớ từ vựng và cấu trúc ngữ pháp vào trí nhớ dài hạn của não bộ.
- Nghiên cứu kỹ thuật thiết kế câu lệnh (Prompt Engineering) và cơ chế RAG (Retrieval-Augmented Generation) dựa trên đối sánh chuỗi dữ liệu chuẩn để kiểm soát phản hồi của mô hình ngôn ngữ lớn (LLM), hạn chế hiện tượng ảo giác (hallucination) của AI khi giải thích kiến thức tiếng Nhật.
- Nghiên cứu mô hình ngôn ngữ lớn mã nguồn mở Llama-3.1-8b-instant thông qua hạ tầng Groq LPU (Language Processing Unit), đánh giá khả năng hiểu ngữ cảnh Nhật ngữ và tốc độ xử lý đàm thoại thời gian thực dưới 0.5 giây.

### 2.2. Mục tiêu thực tiễn
- Thiết kế và xây dựng một hệ thống Web Application hoàn chỉnh sử dụng mô hình Hybrid Cloud AI với kiến trúc phân tách rõ ràng giữa máy chủ dữ liệu (Node.js/Express/PostgreSQL) và máy chủ dịch vụ trí tuệ nhân tạo (Python Flask/Groq LPU/ngrok).
- Hiện thực hóa các phân hệ chức năng cốt lõi:
  * **VocabLab & GrammarLab**: Quản lý ngân hàng dữ liệu bài học N2 phong phú kèm theo cơ chế chèn dữ liệu hàng loạt (Bulk Insert) hiệu năng cao dành cho người quản trị (Admin).
  * **Flashcards System**: Ứng dụng thuật toán SM-2 để tự động tính toán tần suất lặp lại ôn tập thẻ ghi nhớ cá năng hóa theo năng lực tiếp thu của từng học viên.
  * **Test Engine**: Tự động tạo lập đề trắc nghiệm và chấm điểm, lưu lịch sử học tập.
  * **KaiwaHub**: Chatbot giao tiếp đa chế độ (Học tập giải thích ngữ pháp, Kaiwa đời thường N3-N4, Kaiwa N2 công sở nâng cao Keigo) có khả năng phát hiện lỗi ngữ pháp, đưa ra câu sửa lỗi và giải thích tiếng Việt trực quan.

---

## 3. Phạm vi và đối tượng nghiên cứu

### 3.1. Đối tượng nghiên cứu
- **Về mặt Công nghệ**: Lập trình Web Fullstack (ReactJS, TypeScript, Tailwind CSS, Node.js, Express), hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL, lập trình dịch vụ Python Flask, API đàm thoại Groq LPU, mô hình Llama-3.1-8b-instant, thuật toán lặp ngắt quãng SM-2 và cơ chế truy xuất ngữ cảnh bổ trợ RAG.
- **Về mặt Kiến thức**: Hệ thống từ vựng, chữ Kanji, ngữ nghĩa, và cấu trúc ngữ pháp tiếng Nhật trình độ N2 của kỳ thi đánh giá năng lực Nhật ngữ JLPT.

### 3.2. Phạm vi nghiên cứu
- **Giới hạn nội dung**: Tập trung vào việc cung cấp hệ thống học tập tích lũy từ vựng, ngữ pháp trình độ N2 và luyện phản xạ đàm thoại tiếng Nhật đời thường kết hợp với văn phong công sở Nhật Bản (Business Japanese) nâng cao.
- **Giới hạn kỹ thuật**: 
  * Máy chủ AI chạy trên hạ tầng Google Colab liên kết qua đường truyền ngrok.
  * Dữ liệu RAG được đối sánh chuỗi trực tiếp từ file CSV tri thức chuẩn (`JLPT_N2_Grammar_v2.csv`) lưu trữ trong RAM của máy chủ AI Python Flask.
  * Hệ thống kiểm tra trắc nghiệm tự động tạo ngẫu nhiên dựa trên các danh mục từ vựng/ngữ pháp được import vào.

---

## 4. Phương pháp nghiên cứu

Để hoàn thành đồ án tốt nghiệp một cách khoa học và đạt chất lượng tốt nhất, các phương pháp nghiên cứu sau đây đã được áp dụng song song:

- **Phương pháp nghiên cứu lý thuyết (Literature Review)**: Thu thập, đọc hiểu và phân tích các bài báo khoa học, tài liệu kỹ thuật chính thức liên quan đến phát triển ứng dụng Web hiệu năng cao, cơ chế kết nối tối ưu của PostgreSQL, hoạt động của các API LLM thế hệ mới, cấu trúc toán học của thuật toán SuperMemo-2 (SM-2) phục vụ Spaced Repetition, và các phương án xây dựng RAG trong xử lý ngôn ngữ tự nhiên.
- **Phương pháp thực nghiệm (Empirical Method)**:
  * Lập trình triển khai thực tế mã nguồn Frontend và Backend.
  * Thiết kế, đo đạc tốc độ xử lý phản hồi của hệ thống AI khi chuyển đổi qua lại giữa các chế độ Prompt khác nhau.
  * Thực hiện kiểm thử hiệu năng truy vấn database (chuyển đổi từ vòng lặp chèn tuần tự gây nghẽn timeout sang cơ chế Bulk Insert) để đo lường tốc độ xử lý dữ liệu ở môi trường production thực tế.
- **Phương pháp phân tích hệ thống & đánh giá phản hồi (System Analysis & Black-box Testing)**: Đóng vai người học thực tế thực hiện hội thoại bằng tiếng Nhật có chủ ý sai trợ từ, sai ngữ pháp, hoặc sai kính ngữ công sở để kiểm chứng độ nhạy, khả năng phát hiện lỗi và tính chính xác của phản hồi JSON trả về từ chatbot AI.

---

## 5. Cấu trúc của đồ án tốt nghiệp

Nội dung đồ án tốt nghiệp được tổ chức mạch lạc và logic, chia làm các phần chính như sau:

* **MỞ ĐẦU**: Giới thiệu khái quát tính cấp thiết của đề tài, mục đích thực hiện, mục tiêu cụ thể, đối tượng, phạm vi nghiên cứu và phương pháp tiếp cận nghiên cứu.
* **CHƯƠNG 1: CƠ SỞ LÝ THUYẾT**: Trình bày chi tiết lý thuyết nền tảng về phát triển ứng dụng Web SPA (React/Node.js), cơ chế quản lý cơ sở dữ liệu quan hệ PostgreSQL, lý thuyết hoạt động của mô hình ngôn ngữ lớn (LLM) và LPU của Groq, toán học thuật toán lặp lại ngắt quãng SM-2 và nguyên lý kiến trúc RAG phục vụ huấn luyện ngữ cảnh AI.
* **CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG**: Đặc tả yêu cầu người dùng thông qua sơ đồ Use Case, phân tích quy trình nghiệp vụ bằng sơ đồ hoạt động (Activity Diagrams), thiết kế kiến trúc hệ thống Hybrid Cloud AI, sơ đồ luồng dữ liệu (Data Flow) và thiết kế chi tiết lược đồ quan hệ cơ sở dữ liệu (Database Schema).
* **CHƯƠNG 3: TRIỂN KHAI VÀ KẾT QUẢ**: Mô tả chi tiết quá trình lập trình xây dựng các phân hệ chức năng: Phân hệ quản trị bài học của Admin (Import và tối ưu Bulk Insert), Phân hệ thẻ ghi nhớ Flashcard (chạy thuật toán SM-2 cập nhật lịch ôn tập tự động), Phân hệ làm bài thi trắc nghiệm chấm điểm tự động và Phân hệ đàm thoại AI KaiwaHub kết nối tới server ngrok Python Flask. Đồng thời trình bày kết quả thử nghiệm thực tế cùng đánh giá hiệu năng hệ thống.
* **CHƯƠNG 4: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN**: Tổng hợp các kết quả đạt được của đồ án tốt nghiệp, những ưu điểm và hạn chế còn tồn tại, từ đó đề xuất hướng mở rộng và phát triển hệ thống trong tương lai.

---

# TÀI LIỆU THAM KHẢO

1. React Developer Team, "Tài liệu hướng dẫn phát triển giao diện React," react.dev. [Trực tuyến]. Địa chỉ: https://react.dev
2. Microsoft Corporation, "Tài liệu hướng dẫn phát triển ứng dụng bằng ngôn ngữ TypeScript," typescriptlang.org. [Trực tuyến]. Địa chỉ: https://www.typescriptlang.org/docs
3. OpenJS Foundation, "Tài liệu hướng dẫn xây dựng dịch vụ phía máy chủ với Node.js," nodejs.org. [Trực tuyến]. Địa chỉ: https://nodejs.org/en/docs
4. Express Project, "Tài liệu hướng dẫn lập trình Node.js & Express API," expressjs.com. [Trực tuyến]. Địa chỉ: https://expressjs.com
5. PostgreSQL Global Development Group, "Hướng dẫn quản trị và vận hành hệ cơ sở dữ liệu PostgreSQL," postgresql.org. [Trực tuyến]. Địa chỉ: https://www.postgresql.org/docs
6. Groq Inc., "Tài liệu giới thiệu kiến trúc phần cứng suy luận Groq LPU," groq.com. [Trực tuyến]. Địa chỉ: https://groq.com
7. Meta AI, "Tài liệu tích hợp mô hình ngôn ngữ lớn Llama 3 từ Meta," llama.meta.com. [Trực tuyến]. Địa chỉ: https://llama.meta.com
8. SuperMemo World, "Mô tả chi tiết nguyên lý hoạt động của thuật toán lặp lại ngắt quãng SuperMemo-2 (SM-2)," supermemo.com. [Trực tuyến]. Địa chỉ: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
9. NVIDIA Corporation, "Tài liệu nghiên cứu cơ chế sinh tăng cường truy xuất dữ liệu Retrieval-Augmented Generation (RAG)," nvidia.com. [Trực tuyến]. Địa chỉ: https://blogs.nvidia.com/blog/what-is-retrieval-augmented-generation
10. Codelearn Portal, "Tài liệu nghiên cứu mô hình kiến trúc ứng dụng Client-Server," codelearn.io. [Trực tuyến]. Địa chỉ: https://codelearn.io/sharing/tim-hieu-ve-mo-hinh-client-server
11. Neon Inc., "Tài liệu quản trị cơ sở dữ liệu đám mây Neon Serverless PostgreSQL," neon.tech. [Trực tuyến]. Địa chỉ: https://neon.tech/docs
12. LottieFiles, "Tài liệu hướng dẫn tích hợp hoạt họa động Lottie Animation cho ứng dụng Web," lottiefiles.com. [Trực tuyến]. Địa chỉ: https://lottiefiles.com
