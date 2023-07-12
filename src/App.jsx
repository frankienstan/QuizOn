import React, { useState, useEffect } from "react";
import "./App.css";

const QuizApp = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [timer, setTimer] = useState(10);
  const [answersStatus, setAnswersStatus] = useState([]);
  const [isAnswerSelected, setIsAnswerSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [iserror, setIserror] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("https://opentdb.com/api_category.php");
        const data = await response.json();
        setCategories(data.trivia_categories);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setIsLoading(false);
        setIserror(true);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory !== null) {
      const fetchQuestions = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(
            `https://opentdb.com/api.php?amount=5&category=${selectedCategory}&type=multiple`
          );
          const data = await response.json();
          const decodedQuestions = data.results.map((question) => ({
            ...question,
            question: decodeEntities(question.question),
            correct_answer: decodeEntities(question.correct_answer),
            incorrect_answers: question.incorrect_answers.map((answer) =>
              decodeEntities(answer)
            ),
            answers: shuffleAnswers([
              decodeEntities(question.correct_answer),
              ...question.incorrect_answers.map((answer) =>
                decodeEntities(answer)
              ),
            ]),
          }));
          setQuestions(decodedQuestions);
          setCurrentQuestion(0);
          setScore(0);
          setAnswersStatus([]);
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching questions:", error);
          setIsLoading(false);
          setIserror(true);
        }
      };

      fetchQuestions();
    }
  }, [selectedCategory]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleAnswerSelect = (answer) => {
    if (!isAnswerSelected) {
      setSelectedAnswer(answer);
      setIsAnswerSelected(true);
    }
  };

  const handleNextQuestion = () => {
    const isAnswerCorrect =
      selectedAnswer === questions[currentQuestion].correct_answer;
    setAnswersStatus((prevStatus) => [...prevStatus, isAnswerCorrect]);

    if (isAnswerCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    setSelectedAnswer("");
    setCurrentQuestion((prevQuestion) => prevQuestion + 1);
    setTimer(10);
    setIsAnswerSelected(false);
  };
  useEffect(() => {
    if (currentQuestion < questions.length && questions.length > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1100);

      if (timer === 0) {
        clearInterval(interval);
        handleNextQuestion();
      }

      return () => {
        clearInterval(interval);
      };
    }
  }, [currentQuestion, timer, questions]);
  const restartQuiz = () => {
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer("");
    setTimer(10);
    setAnswersStatus([]);
    setIsAnswerSelected(false);
  };

  const renderLoading = () => {
    return <div className="custom-loader"></div>;
  };

  const errorscreen = () => {
    return <a href="./">Network error tryagain</a>;
  };

  const renderCategorySelection = () => {
    return (
      <div className="startcard">
        <h1 className="category_heading">Quiz On</h1>
        <h3>Select a category to start the quiz</h3>

        <div className="category_list">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
        <p className="instructions">
          Instructions: Total five questions, each question has 10 seconds time
          limit.
        </p>
      </div>
    );
  };

  const renderScoreCard = () => {
    return (
      <div className="quiz_complete_card">
        <div className="quiz_complete_title">
          <h2>Quiz Completed!</h2>
          <h3>
            Score: {score} / {questions.length}
          </h3>
        </div>

        <ol className="quiz_complete_questions">
          {questions.map((question, index) => (
            <li key={index}>
              <span>{question.question}</span>
              <span>{answersStatus[index] ? "✔️" : "❌"}</span>
              <br />
              Correct Answer:{" "}
              <span
                style={{
                  color: answersStatus[index] ? "MediumSeaGreen" : "inherit",
                }}
              >
                {question.correct_answer}
              </span>
            </li>
          ))}
        </ol>
        <button onClick={restartQuiz} className="restart_quiz_button">
          Restart Quiz
        </button>
      </div>
    );
  };

  const renderQuestion = () => {
    const { question, answers } = questions[currentQuestion];

    return (
      <div className="question_card">
        <h4 className="categoryname">
          Category:{" "}
          {
            categories.find((category) => category.id === selectedCategory)
              ?.name
          }
        </h4>
        <div className="questionnum">
          <h4>
            Question {currentQuestion + 1} / {questions.length}
          </h4>
          {timer === 0 && <p>Time's up!</p>}
          <p>Timer: {timer}s</p>
        </div>
        <h3 className="question">{question}</h3>
        <ol className="options">
          {answers.map((answer, index) => (
            <li key={index}>
              <button
                onClick={() => handleAnswerSelect(answer)}
                disabled={timer === 0 || isAnswerSelected}
                className={`answer-btn ${
                  selectedAnswer === answer
                    ? selectedAnswer ===
                      questions[currentQuestion].correct_answer
                      ? "correct_ans"
                      : "incorrect_ans"
                    : isAnswerSelected &&
                      questions[currentQuestion].correct_answer === answer
                    ? "correct_ans"
                    : ""
                }`}
                style={{ cursor: isAnswerSelected ? "not-allowed" : "pointer" }}
              >
                {index + 1 + ". "}
                {answer}
              </button>
            </li>
          ))}
        </ol>

        <button
          onClick={handleNextQuestion}
          disabled={!selectedAnswer || timer === 0}
          className="nextbutton"
          style={{ cursor: !selectedAnswer ? "not-allowed" : "pointer" }}
        >
          Next Question
        </button>
      </div>
    );
  };

  if (isLoading) {
    return renderLoading();
  }
  if (iserror) {
    return errorscreen();
  }
  if (!selectedCategory) {
    return renderCategorySelection();
  }

  if (currentQuestion >= questions.length) {
    return renderScoreCard();
  }

  return renderQuestion();
};

// Function to decode HTML entities
const decodeEntities = (html) => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  return textarea.value;
};

// Function to shuffle answer options
const shuffleAnswers = (answers) => {
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  return answers;
};

export default QuizApp;
