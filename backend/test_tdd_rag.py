import unittest

from retrieval_boost import detect_boost, get_dynamic_top_k, route_query


class TestPortfolioRouter(unittest.TestCase):
    def assertRoute(self, query, category, project_id=None, intent=None, top_k=None):
        route = route_query(query)
        self.assertEqual(route.category, category, f"Query '{query}' should route to category '{category}'")
        self.assertEqual(route.project_id, project_id, f"Query '{query}' should route to project_id '{project_id}'")
        if intent is not None:
            self.assertEqual(route.intent, intent, f"Query '{query}' should route to intent '{intent}'")
        if top_k is not None:
            boost = detect_boost(query)
            self.assertEqual(get_dynamic_top_k(query, boost), top_k, f"Query '{query}' should return top_k = {top_k}")

    def test_routing_cases(self):
        cases = [
            ("hi", "greeting", None, "greeting", 0),
            ("hello", "greeting", None, "greeting", 0),
            ("xin chào", "greeting", None, "greeting", 0),
            ("Email của Quốc là gì?", "contact", None, "category:contact", 1),
            ("Số điện thoại của bạn?", "contact", None, "category:contact", 1),
            ("LinkedIn của Quốc ở đâu?", "contact", None, "category:contact", 1),
            ("Quốc học ở đâu?", "education", None, "category:education", 3),
            ("Quốc tốt nghiệp trường nào?", "education", None, "category:education", 3),
            ("GPA của Quốc bao nhiêu?", "education", None, "category:education", 3),
            ("Quốc có kinh nghiệm gì?", "experience", None, "category:experience", 3),
            ("Quốc từng làm intern ở đâu?", "experience", None, "category:experience", 3),
            ("Tech stack của Quốc là gì?", "skills", None, "category:skills", 3),
            ("Quốc có kỹ năng AI nào?", "competencies", None, "category:competencies", 3),
            ("Quốc đang tìm hiểu microservices như thế nào?", "competencies", None, "category:competencies", 3),
            ("Quốc có quan tâm đến fintech không?", "competencies", None, "category:competencies", 3),
            ("Quốc là ai?", "personal_info", None, "category:personal_info", 3),
            ("Giới thiệu về Quốc", "personal_info", None, "category:personal_info", 3),
            ("Quốc liên hệ qua đâu?", "contact", None, "category:contact", 1),
            ("Quốc học ở đâu?", "education", None, "category:education", 3),
            ("Quốc từng làm ở công ty nào?", "experience", None, "category:experience", 3),
            ("Quốc đã làm những dự án nào?", "project", None, "category:project", 3),
            ("Dự án điểm danh hoạt động như thế nào?", "project_detail", "attendance-app", "project:attendance", 4),
            ("Attendance app chống gian lận ra sao?", "project_detail", "attendance-app", "project:attendance", 4),
            ("Movie ticket booking dùng locking gì?", "project_detail", "movie-ticket", "project:movie_ticket", 4),
            ("EduRAG cải thiện recall thế nào?", "project_detail", "edurag-app", "project:edurag", 4),
        ]

        for query, category, project_id, intent, top_k in cases:
            with self.subTest(query=query):
                self.assertRoute(query, category, project_id, intent, top_k)

    def test_general_query_falls_back_to_general(self):
        route = route_query("Tôi muốn biết thêm")
        self.assertEqual(route.category, "general")
        self.assertIsNone(route.project_id)
        self.assertEqual(route.intent, "general")

    def test_project_query_without_specific_project_remains_project(self):
        route = route_query("Mô tả các dự án của Quốc")
        self.assertEqual(route.category, "project")
        self.assertIsNone(route.project_id)


if __name__ == "__main__":
    unittest.main()
