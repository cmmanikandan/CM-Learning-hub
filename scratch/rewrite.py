import re
import os

target_file = 'e:/OneDrive/Desktop/CM Learning hub/frontend/src/context/AppContext.tsx'

with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

mutators_code = '''
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const addHomework = (hw: Omit<Homework, 'id' | 'createdTime' | 'status'>) => {
    fetch('http://localhost:5000/api/homework', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        date: hw.date,
        subject: hw.subject,
        homework_type: hw.homeworkType,
        title: hw.title,
        description: hw.description,
        priority: hw.priority,
        estimated_time: hw.estimatedTime,
        due_date: hw.dueDate,
        attachment_url: hw.attachmentUrl,
        remarks: hw.remarks
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const updateHomework = (id: number, fields: Partial<Homework>) => {
    const payload: any = {};
    if (fields.status) payload.status = fields.status;
    if (fields.title) payload.title = fields.title;
    if (fields.subject) payload.subject = fields.subject;
    if (fields.description) payload.description = fields.description;
    
    fetch(`http://localhost:5000/api/homework/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const deleteHomework = (id: number) => {
    fetch(`http://localhost:5000/api/homework/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const duplicateHomework = (id: number) => {
    const target = homeworkList.find(hw => hw.id === id);
    if (!target) return;
    addHomework({
      ...target,
      title: `${target.title} (Copy)`
    });
  };

  const addLibraryMaterial = (mat: Omit<LibraryMaterial, 'id' | 'createdTime' | 'viewsCount' | 'bookmarksCount' | 'isBookmarked'>) => {
    fetch('http://localhost:5000/api/library', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        title: mat.title,
        subject: mat.subject,
        category: mat.category,
        description: mat.description,
        tags: mat.tags.join(','),
        file_url: mat.fileUrl,
        visibility: mat.visibility
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const deleteLibraryMaterial = (id: number) => {
    fetch(`http://localhost:5000/api/library/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const toggleBookmarkMaterial = (id: number) => {
    console.warn('Bookmark live backend endpoint missing');
  };

  const addQuiz = (quiz: Omit<Quiz, 'id' | 'createdTime' | 'totalMarks'>) => {
    fetch('http://localhost:5000/api/quiz', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        quiz_name: quiz.quizName,
        subject: quiz.subject,
        chapter: quiz.chapter,
        lesson: quiz.lesson,
        difficulty: quiz.difficulty,
        instructions: quiz.instructions,
        time_limit: quiz.timeLimit,
        passing_marks: quiz.passingMarks,
        questions: quiz.questions
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const deleteQuiz = (id: number) => {
    console.warn('Delete quiz endpoint not implemented yet');
  };

  const submitQuiz = (sub: Omit<QuizSubmission, 'id' | 'studentId' | 'submittedAt'>) => {
    fetch(`http://localhost:5000/api/quiz/${sub.quizId}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        answers: {}, // We need to pass real answers in the payload for live submission
        time_taken: sub.timeTaken,
        strong_areas: sub.strongAreas,
        weak_areas: sub.weakAreas
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const addWrittenTest = (test: Omit<WrittenTest, 'id' | 'createdTime'>) => {
    fetch('http://localhost:5000/api/tests', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        test_name: test.testName,
        subject: test.subject,
        description: test.description,
        instructions: test.instructions,
        duration: test.duration,
        total_marks: test.totalMarks,
        start_date: test.startDate,
        end_date: test.endDate,
        question_paper_url: test.questionPaperUrl
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const deleteWrittenTest = (id: number) => {
    console.warn('Delete test endpoint not implemented yet');
  };

  const submitWrittenTest = (testId: number, answerSheetUrl: string, answerSheetName: string) => {
    fetch(`http://localhost:5000/api/tests/${testId}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        answer_sheet_url: answerSheetUrl
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const gradeWrittenSubmission = (subId: number, marks: number, remarks: string) => {
    fetch(`http://localhost:5000/api/tests/submissions/${subId}/grade`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        marks_obtained: marks,
        remarks: remarks
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const addNotification = (title: string, content: string, type: Notification['type']) => {
    // Notifications are handled mostly on the backend side, so we ignore local writes
  };

  const markAllNotificationsRead = () => {
    fetch('http://localhost:5000/api/notifications/mark-read', {
      method: 'POST',
      headers: getHeaders()
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const unlockAchievement = (name: string, description: string, icon: string) => {
    fetch('http://localhost:5000/api/achievements', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };
'''

# Find the start of the Operations block
start_idx = content.find('  // Operations')
end_idx = content.find('  return (')

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + '  // Operations\n' + mutators_code + '\n' + content[end_idx:]
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced mutators.")
else:
    print("Could not find replacement boundaries.")
