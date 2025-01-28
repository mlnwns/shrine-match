import { useState } from "react";
import styled from "styled-components";
import question_background from "../assets/question_background.png";
import QuestionContent from "../components/QuestionPage/QuestionContent";
import ChoiceButtons from "../components/QuestionPage/ChoiceButtons";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { supabase } from "../supabase";

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

const LoadingImage = styled.img`
  width: 100px;
  height: auto;
  margin-bottom: 20px;
`;

const LoadingText = styled.div`
  color: white;
  font-size: 18px;
  font-family: "Pretendard", sans-serif;
  display: flex;
  align-items: center;

  &::after {
    content: "";
    display: inline-block;
    animation: dotAnimation 1.5s infinite;
    margin-left: 4px;
  }

  @keyframes dotAnimation {
    0% {
      content: "";
    }
    25% {
      content: ".";
    }
    50% {
      content: "..";
    }
    75% {
      content: "...";
    }
    100% {
      content: "";
    }
  }
`;

const answerCombinationToResult = {
  "1,3,8": 1,
  "1,3,9": 9,
  "1,3,10": 3,
  "1,3,11": 7,
  "1,4,8": 15,
  "1,4,9": 13,
  "1,4,10": 4,
  "1,4,11": 8,
  "2,3,8": 2,
  "2,3,9": 20,
  "2,3,10": 14,
  "2,3,11": 17,
  "2,4,8": 19,
  "2,4,9": 21,
  "2,4,10": 18,
  "2,4,11": 16,
};

const IGNORED_ANSWER_IDS = [5, 6, 7];

function QuestionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const { questions, answers, currentQuestionIndex, selectedAnswers } = location.state || {};

  const currentQuestion = questions?.[currentQuestionIndex];
  const currentAnswers = answers?.filter((answer) => answer.question_id === currentQuestion?.id);

  const calculateResultId = (answers) => {
    if (!answers || answers.length === 0) return 1;
    const filteredAnswers = answers.filter((id) => !IGNORED_ANSWER_IDS.includes(id));
    const key = [...filteredAnswers].sort((a, b) => a - b).join(",");
    return answerCombinationToResult[key] || 1;
  };

  const fetchResultData = async (newSelectedAnswers) => {
    try {
      const resultId = calculateResultId(newSelectedAnswers);
      const { data, error } = await supabase.from("results").select("*").eq("id", resultId).single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("결과 데이터를 가져오는 데 실패했습니다.", error);
      return null;
    }
  };

  const handleAnswerSelect = async (answerId) => {
    const newSelectedAnswers = [...selectedAnswers, answerId];

    if (currentQuestionIndex < questions.length - 1) {
      navigate(`/question/${currentQuestionIndex + 2}`, {
        state: {
          questions,
          answers,
          currentQuestionIndex: currentQuestionIndex + 1,
          selectedAnswers: newSelectedAnswers,
        },
      });
    } else {
      setIsLoading(true);
      const resultData = await fetchResultData(newSelectedAnswers);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      navigate("/result", {
        state: {
          selectedAnswers: newSelectedAnswers,
          preloadedResult: resultData,
        },
      });
    }
  };

  const questionColumn = `question_${language === "한국어" ? "ko" : language === "English" ? "en" : "jp"}`;
  const answerColumn = `answer_${language === "한국어" ? "ko" : language === "English" ? "en" : "jp"}`;

  if (!questions || !answers) {
    return <div>로딩 중...</div>;
  }

  return (
    <QuestionLayout>
      <BackgroundImg src={question_background} alt="Background" />
      <QuestionContent
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        questionText={currentQuestion[questionColumn]}
      />
      <ChoiceButtonsContainer>
        {currentAnswers.map((answer) => (
          <ChoiceButtons
            key={answer.id}
            choiceText={answer[answerColumn]}
            onSelect={() => handleAnswerSelect(answer.id)}
          />
        ))}
      </ChoiceButtonsContainer>
      {isLoading && (
        <LoadingOverlay>
          <LoadingImage src={new URL("../assets/loading.png", import.meta.url).href} alt="Loading" />
          <LoadingText>성향과 상황에 맞는 신사를 추천해주고 있어요</LoadingText>
        </LoadingOverlay>
      )}
    </QuestionLayout>
  );
}

export default QuestionPage;

const QuestionLayout = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;
`;

const BackgroundImg = styled.img`
  width: 100%;
  height: auto;
  object-fit: contain;
  margin-bottom: 4vh;
`;

const ChoiceButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 0 20px;
`;
