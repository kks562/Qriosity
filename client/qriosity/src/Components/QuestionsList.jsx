import { useEffect, useState } from "react";
import { getQuestions } from "./StackApi";
import QuestionDetail from "./QuestionDetail";

export default function QuestionsList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const data = await getQuestions();
        setQuestions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  if (loading) return <p>Loading questions...</p>;

  return (
    <div>
      <h2>Latest Questions</h2>
      <ul>
        {questions.map((q) => (
          <li key={q.question_id}>
            <QuestionDetail question={q} />
          </li>
        ))}
      </ul>
    </div>
  );
}
