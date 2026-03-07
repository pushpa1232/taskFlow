/**
 * TaskFlow - Modern To-Do List
 * JavaScript Application
 */

// ========================================
// State Management
// ========================================
const state = {
    tasks: [],
    currentFilter: 'all',
    theme: 'light'
};

// ========================================
// DOM Elements
// ========================================
const elements = {
    taskForm: document.getElementById('taskForm'),
    taskInput: document.getElementById('taskInput'),
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    taskCount: document.getElementById('activeCount'),
    clearCompleted: document.getElementById('clearCompleted'),
    themeToggle: document.getElementById('themeToggle'),
    filterButtons: document.querySelectorAll('.filter-btn')
};

// ========================================
// LocalStorage Keys
// ========================================
const STORAGE_KEYS = {
    TASKS: 'taskflow_tasks',
    THEME: 'taskflow_theme'
};

// ========================================
// Utility Functions
// ========================================

/**
 * Generate unique ID for tasks
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Save tasks to localStorage
 */
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
}

/**
 * Load tasks from localStorage
 */
function loadTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
        if (stored) {
            state.tasks = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        state.tasks = [];
    }
}

/**
 * Save theme preference
 */
function saveTheme() {
    try {
        localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
    } catch (error) {
        console.error('Error saving theme:', error);
    }
}

/**
 * Load theme preference
 */
function loadTheme() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.THEME);
        if (stored) {
            return stored;
        }
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    } catch (error) {
        console.error('Error loading theme:', error);
        return 'light';
    }
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    state.theme = theme;
}

// ========================================
// Task Management Functions
// ========================================

/**
 * Add a new task
 */
function addTask(text) {
    const trimmedText = text.trim();
    if (!trimmedText) return false;

    const newTask = {
        id: generateId(),
        text: trimmedText,
        completed: false,
        createdAt: Date.now()
    };

    // Add to beginning of array
    state.tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateTaskCount();
    
    return true;
}

/**
 * Delete a task
 */
function deleteTask(id) {
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    
    if (taskElement) {
        taskElement.classList.add('deleting');
        
        // Wait for animation to complete
        setTimeout(() => {
            state.tasks = state.tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            updateTaskCount();
        }, 300);
    } else {
        state.tasks = state.tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
}

/**
 * Toggle task completion status
 */
function toggleTaskComplete(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
}

/**
 * Update task text
 */
function updateTaskText(id, newText) {
    const trimmedText = newText.trim();
    const task = state.tasks.find(t => t.id === id);
    
    if (task) {
        if (trimmedText) {
            task.text = trimmedText;
        } else {
            // If empty, delete the task
            deleteTask(id);
            return;
        }
        saveTasks();
        renderTasks();
    }
}

/**
 * Clear all completed tasks
 */
function clearCompletedTasks() {
    const completedTasks = state.tasks.filter(task => task.completed);
    
    if (completedTasks.length === 0) return;

    // Add deleting animation to all completed tasks
    completedTasks.forEach(task => {
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
        if (taskElement) {
            taskElement.classList.add('deleting');
        }
    });

    setTimeout(() => {
        state.tasks = state.tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTaskCount();
    }, 300);
}

/**
 * Filter tasks based on current filter
 */
function getFilteredTasks() {
    switch (state.currentFilter) {
        case 'active':
            return state.tasks.filter(task => !task.completed);
        case 'completed':
            return state.tasks.filter(task => task.completed);
        default:
            return state.tasks;
    }
}

// ========================================
// Render Functions
// ========================================

/**
 * Render all tasks
 */
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    // Clear current list
    elements.taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        elements.emptyState.style.display = 'flex';
    } else {
        elements.emptyState.style.display = 'none';
        
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            elements.taskList.appendChild(taskElement);
        });
    }
}

/**
 * Create a task list item element
 */
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item${task.completed ? ' completed' : ''}`;
    li.setAttribute('data-task-id', task.id);
    li.setAttribute('role', 'listitem');

    li.innerHTML = `
        <label class="task-checkbox">
            <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}">
            <span class="checkbox-custom">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </span>
        </label>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-actions">
            <button class="action-btn edit-btn" aria-label="Edit task" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="action-btn delete-btn" aria-label="Delete task" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        </div>
    `;

    // Add event listeners
    const checkbox = li.querySelector('.task-checkbox input');
    checkbox.addEventListener('change', () => toggleTaskComplete(task.id));

    const editBtn = li.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => enableTaskEdit(li, task));

    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    return li;
}

/**
 * Enable task editing mode
 */
function enableTaskEdit(taskElement, task) {
    const textSpan = taskElement.querySelector('.task-text');
    const currentText = task.text;

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-text-input';
    input.value = currentText;

    // Replace text with input
    textSpan.replaceWith(input);
    input.focus();
    input.select();

    // Handle save on Enter or blur
    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText) {
            // Create new text span
            const newSpan = document.createElement('span');
            newSpan.className = 'task-text';
            newSpan.textContent = newText;
            input.replaceWith(newSpan);
            
            // Update task
            updateTaskText(task.id, newText);
        } else {
            // Empty text - delete task
            deleteTask(task.id);
        }
    };

    // Handle cancel on Escape
    const cancelEdit = () => {
        const newSpan = document.createElement('span');
        newSpan.className = 'task-text';
        newSpan.textContent = currentText;
        input.replaceWith(newSpan);
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    });

    input.addEventListener('blur', saveEdit);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Update active task count
 */
function updateTaskCount() {
    const activeCount = state.tasks.filter(task => !task.completed).length;
    elements.taskCount.textContent = activeCount;
}

// ========================================
// Event Handlers
// ========================================

/**
 * Handle form submission
 */
function handleFormSubmit(e) {
    e.preventDefault();
    const text = elements.taskInput.value;
    
    if (addTask(text)) {
        elements.taskInput.value = '';
        elements.taskInput.focus();
    }
}

/**
 * Handle filter button click
 */
function handleFilterClick(filter) {
    state.currentFilter = filter;
    
    // Update button states
    elements.filterButtons.forEach(btn => {
        const isActive = btn.dataset.filter === filter;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
    
    renderTasks();
}

/**
 * Handle theme toggle
 */
function handleThemeToggle() {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    saveTheme();
}

// ========================================
// Initialize Application
// ========================================

/**
 * Initialize the application
 */
function init() {
    // Load saved data
    loadTasks();
    
    // Apply saved theme
    const savedTheme = loadTheme();
    applyTheme(savedTheme);
    
    // Set up event listeners
    elements.taskForm.addEventListener('submit', handleFormSubmit);
    
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            handleFilterClick(btn.dataset.filter);
        });
    });
    
    elements.clearCompleted.addEventListener('click', clearCompletedTasks);
    elements.themeToggle.addEventListener('click', handleThemeToggle);
    
    // Handle system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    // Initial render
    renderTasks();
    updateTaskCount();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
