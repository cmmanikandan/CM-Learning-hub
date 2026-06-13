import re

with open('frontend/src/pages/HomeworkManager.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace states
old_states = """  const [editingHw, setEditingHw] = useState<Homework | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: 'Mathematics',
    homeworkType: 'School Homework' as Homework['homeworkType'],
    title: '',
    description: '',
    priority: 'Medium' as Homework['priority'],
    estimatedTime: 30,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    remarks: '',
    attachmentName: ''
  });"""

new_states = """  const [editingHw, setEditingHw] = useState<Homework | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    homeworkType: 'School Homework' as Homework['homeworkType'],
    priority: 'Medium' as Homework['priority'],
    estimatedTime: 30,
    remarks: '',
    attachmentName: ''
  });

  const [homeworkItems, setHomeworkItems] = useState([{ id: Date.now(), subject: '', description: '' }]);"""

code = code.replace(old_states, new_states)

# Replace handleTemplateChange
old_template = """  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = e.target.value;
    if (template === 'math') {
      setFormData(prev => ({
        ...prev,
        subject: 'Mathematics',
        title: 'Weekly Math Revision Sheet',
        description: 'Complete the revision worksheet questions matching algebraic equations and functions. Show all rough workings.',
        estimatedTime: 40,
        attachmentName: 'Math_Revision_Week_Sheet.pdf'
      }));
    } else if (template === 'science') {
      setFormData(prev => ({
        ...prev,
        subject: 'Physics',
        title: 'Light Refraction Calculation Practice',
        description: 'Complete the refractive index calculation problems 1-10 on page 45 of textbook.',
        estimatedTime: 30,
        attachmentName: 'Physics_Refraction_Notes.pdf'
      }));
    }
  };"""

new_template = """  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = e.target.value;
    if (template === 'math') {
      setFormData(prev => ({
        ...prev,
        homeworkType: 'School Homework',
        estimatedTime: 40,
        attachmentName: 'Math_Revision_Week_Sheet.pdf'
      }));
      setHomeworkItems([{ id: Date.now(), subject: 'Mathematics', description: 'Complete the revision worksheet questions matching algebraic equations and functions. Show all rough workings.' }]);
    } else if (template === 'science') {
      setFormData(prev => ({
        ...prev,
        homeworkType: 'Extra Practice Homework',
        estimatedTime: 30,
        attachmentName: 'Physics_Refraction_Notes.pdf'
      }));
      setHomeworkItems([{ id: Date.now(), subject: 'Physics', description: 'Complete the refractive index calculation problems 1-10 on page 45 of textbook.' }]);
    }
  };"""

code = code.replace(old_template, new_template)

# Replace handleSubmit
old_submit = """  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    if (editingHw) {
      updateHomework(editingHw.id, formData);
      setEditingHw(null);
    } else {
      addHomework(formData);
    }
    
    // Reset Form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      subject: 'Mathematics',
      homeworkType: 'School Homework',
      title: '',
      description: '',
      priority: 'Medium',
      estimatedTime: 30,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      remarks: '',
      attachmentName: ''
    });
    setShowCreateModal(false);
  };"""

new_submit = """  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeworkItems.some(item => !item.subject || !item.description)) return;

    if (editingHw) {
      updateHomework(editingHw.id, {
        date: formData.date,
        dueDate: formData.date, // Same day
        homeworkType: formData.homeworkType,
        subject: homeworkItems[0].subject,
        title: `${formData.homeworkType} - ${homeworkItems[0].subject}`,
        description: homeworkItems[0].description,
        priority: formData.priority,
        estimatedTime: formData.estimatedTime,
        attachmentName: formData.attachmentName,
        remarks: formData.remarks
      });
      setEditingHw(null);
    } else {
      homeworkItems.forEach(item => {
        addHomework({
          date: formData.date,
          dueDate: formData.date,
          homeworkType: formData.homeworkType,
          subject: item.subject,
          title: `${formData.homeworkType} - ${item.subject}`,
          description: item.description,
          priority: formData.priority,
          estimatedTime: formData.estimatedTime,
          attachmentName: formData.attachmentName,
        });
      });
    }
    
    // Reset Form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      homeworkType: 'School Homework',
      priority: 'Medium',
      estimatedTime: 30,
      remarks: '',
      attachmentName: ''
    });
    setHomeworkItems([{ id: Date.now(), subject: '', description: '' }]);
    setShowCreateModal(false);
  };"""

code = code.replace(old_submit, new_submit)

# Replace startEdit
old_edit = """  const startEdit = (hw: Homework) => {
    setEditingHw(hw);
    setFormData({
      date: hw.date,
      subject: hw.subject,
      homeworkType: hw.homeworkType,
      title: hw.title,
      description: hw.description,
      priority: hw.priority,
      estimatedTime: hw.estimatedTime,
      dueDate: hw.dueDate,
      remarks: hw.remarks || '',
      attachmentName: hw.attachmentName || ''
    });
    setShowCreateModal(true);
  };"""

new_edit = """  const startEdit = (hw: Homework) => {
    setEditingHw(hw);
    setFormData({
      date: hw.date,
      homeworkType: hw.homeworkType,
      priority: hw.priority,
      estimatedTime: hw.estimatedTime,
      remarks: hw.remarks || '',
      attachmentName: hw.attachmentName || ''
    });
    setHomeworkItems([{ id: Date.now(), subject: hw.subject, description: hw.description }]);
    setShowCreateModal(true);
  };"""

code = code.replace(old_edit, new_edit)

with open('frontend/src/pages/HomeworkManager.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Phase 1 Script finished')
