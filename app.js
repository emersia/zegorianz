// JSON Prompt Generator Application Logic

class JSONPromptGenerator {
    constructor() {
        this.templates = this.getTemplates();
        this.customTemplates = this.loadCustomTemplates();
        this.fields = [];
        this.currentEditingField = null;
        this.settings = this.loadSettings();
        
        this.initializeApp();
        this.bindEventListeners();
        this.loadDefaultTemplate();
        this.updateAIButtonText();
    }

    getTemplates() {
        return [
            {
                id: "content-creation",
                name: "Content Creation",
                category: "Marketing",
                description: "Create blog posts, social media content, and marketing copy",
                schema: {
                    task: "write content",
                    platform: "blog",
                    topic: "",
                    audience: "",
                    tone: "professional",
                    length: "1000-1500 words",
                    structure: ["introduction", "main points", "conclusion"],
                    output_format: "markdown"
                }
            },
            {
                id: "code-generation",
                name: "Code Generation",
                category: "Development",
                description: "Generate code in various programming languages",
                schema: {
                    task: "write code",
                    language: "python",
                    goal: "",
                    constraints: [],
                    include_comments: true,
                    output_format: "code only"
                }
            },
            {
                id: "business-strategy",
                name: "Business Strategy",
                category: "Business",
                description: "Analyze markets, competition, and business strategies",
                schema: {
                    task: "business analysis",
                    company: "",
                    focus_area: "",
                    analysis_type: "SWOT",
                    deliverables: ["summary", "recommendations"],
                    tone: "professional",
                    output_format: "structured report"
                }
            },
            {
                id: "data-analysis",
                name: "Data Analysis",
                category: "Analytics",
                description: "Analyze datasets and extract insights",
                schema: {
                    task: "analyze data",
                    data_type: "",
                    analysis_goal: "",
                    metrics: [],
                    visualization: false,
                    output_format: "detailed insights"
                }
            },
            {
                id: "customer-service",
                name: "Customer Service",
                category: "Support",
                description: "Generate professional customer service responses",
                schema: {
                    task: "customer response",
                    issue_type: "",
                    customer_context: "",
                    tone: "helpful and professional",
                    include_steps: true,
                    output_format: "email response"
                }
            },
            {
                id: "educational-content",
                name: "Educational Content",
                category: "Education",
                description: "Create lessons, courses, and educational materials",
                schema: {
                    task: "create educational content",
                    subject: "",
                    level: "beginner",
                    format: "lesson plan",
                    duration: "30 minutes",
                    learning_objectives: [],
                    output_format: "structured content"
                }
            }
        ];
    }

    initializeApp() {
        this.populateTemplateDropdown();
        this.updateJSONPreview();
    }

    populateTemplateDropdown() {
        const templateSelect = document.getElementById('templateSelect');
        
        // Clear existing options except the first one
        templateSelect.innerHTML = '<option value="">Select a template...</option>';
        
        // Add built-in templates
        const builtInOptgroup = document.createElement('optgroup');
        builtInOptgroup.label = 'Built-in Templates';
        this.templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            builtInOptgroup.appendChild(option);
        });
        templateSelect.appendChild(builtInOptgroup);

        // Add custom templates if any exist
        if (this.customTemplates.length > 0) {
            const customOptgroup = document.createElement('optgroup');
            customOptgroup.label = 'Custom Templates';
            this.customTemplates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = template.name;
                customOptgroup.appendChild(option);
            });
            templateSelect.appendChild(customOptgroup);
        }
    }

    loadCustomTemplates() {
        const savedTemplates = localStorage.getItem('customTemplates');
        return savedTemplates ? JSON.parse(savedTemplates) : [];
    }

    saveCustomTemplate(template) {
        // If template has an id, it's an edit operation
        const existingIndex = this.customTemplates.findIndex(t => t.id === template.id);
        if (existingIndex !== -1) {
            this.customTemplates[existingIndex] = template;
        } else {
            this.customTemplates.push(template);
        }
        localStorage.setItem('customTemplates', JSON.stringify(this.customTemplates));
        this.populateTemplateDropdown();
    }

    editCustomTemplate(template) {
        // Populate the save template modal with the template's data
        document.getElementById('templateName').value = template.name;
        document.getElementById('templateCategory').value = template.category || '';
        document.getElementById('templateDescription').value = template.description || '';
        
        // Load the template's fields
        this.fields = [];
        Object.entries(template.schema).forEach(([key, value]) => {
            const fieldType = this.getFieldType(value);
            this.fields.push({
                id: this.generateId(),
                name: key,
                value: value,
                type: fieldType,
                required: key === 'task'
            });
        });
        
        this.renderFields();
        this.updateJSONPreview();

        // Close the manage templates modal and show the editing interface
        document.getElementById('manageTemplatesModal').classList.add('hidden');

        // Show the main editing interface
        document.getElementById('saveTemplateModal').dataset.editingTemplateId = template.id;
        document.getElementById('saveTemplateModal').classList.remove('hidden');
    }

    deleteCustomTemplate(templateId) {
        this.customTemplates = this.customTemplates.filter(t => t.id !== templateId);
        localStorage.setItem('customTemplates', JSON.stringify(this.customTemplates));
        
        // If the deleted template was the last used one, remove it from lastUsedTemplate
        if (localStorage.getItem('lastUsedTemplate') === templateId) {
            localStorage.removeItem('lastUsedTemplate');
        }
        
        this.populateTemplateDropdown();
        this.renderCustomTemplatesList();
    }

    renderCustomTemplatesList() {
        const container = document.getElementById('customTemplatesList');
        
        if (this.customTemplates.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Custom Templates</h3>
                    <p>Save your current configuration as a template to see it here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.customTemplates.map(template => `
            <div class="template-item" data-template-id="${template.id}">
                <div class="template-item-header">
                    <div>
                        <div class="template-item-name">${template.name}</div>
                        ${template.category ? `<span class="template-item-category">${template.category}</span>` : ''}
                    </div>
                </div>
                ${template.description ? `<div class="template-item-description">${template.description}</div>` : ''}
                <div class="template-item-fields">
                    ${Object.entries(template.schema).map(([key, value]) => `
                        <div class="template-field" data-field-key="${key}">
                            <div class="template-field-content">
                                <div class="template-field-name">${key}</div>
                                <div class="template-field-value">${typeof value === 'object' ? JSON.stringify(value) : value}</div>
                            </div>
                            <div class="template-field-edit hidden">
                                <input type="text" class="form-control field-name-input" value="${key}" placeholder="Field name">
                                <input type="text" class="form-control field-value-input" value="${typeof value === 'object' ? JSON.stringify(value) : value}" placeholder="Field value">
                                <select class="form-control field-type-select">
                                    <option value="string" ${typeof value === 'string' ? 'selected' : ''}>Text</option>
                                    <option value="number" ${typeof value === 'number' ? 'selected' : ''}>Number</option>
                                    <option value="boolean" ${typeof value === 'boolean' ? 'selected' : ''}>Boolean</option>
                                    <option value="array" ${Array.isArray(value) ? 'selected' : ''}>Array</option>
                                    <option value="object" ${!Array.isArray(value) && typeof value === 'object' ? 'selected' : ''}>Object</option>
                                </select>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="template-item-actions">
                    <button class="btn btn--outline btn--sm load-template-btn">Load</button>
                    <button class="btn btn--outline btn--sm edit-template-btn">Edit</button>
                    <button class="btn btn--outline btn--sm save-template-btn hidden">Save</button>
                    <button class="btn btn--outline btn--sm cancel-edit-btn hidden">Cancel</button>
                    <button class="btn btn--outline btn--sm add-field-btn hidden">Add Field</button>
                    <button class="btn btn--outline btn--sm delete-template-btn">Delete</button>
                </div>
            </div>
        `).join('');

        // Bind events for template actions
        container.querySelectorAll('.load-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.closest('.template-item').dataset.templateId;
                const template = this.customTemplates.find(t => t.id === templateId);
                if (template) {
                    this.loadTemplate(templateId);
                    document.getElementById('manageTemplatesModal').classList.add('hidden');
                }
            });
        });

        container.querySelectorAll('.delete-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.closest('.template-item').dataset.templateId;
                if (confirm('Are you sure you want to delete this template?')) {
                    this.deleteCustomTemplate(templateId);
                }
            });
        });

        container.querySelectorAll('.edit-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateItem = e.target.closest('.template-item');
                const templateId = templateItem.dataset.templateId;
                
                // Show edit interface
                templateItem.classList.add('editing');
                templateItem.querySelectorAll('.template-field-content').forEach(el => el.classList.add('hidden'));
                templateItem.querySelectorAll('.template-field-edit').forEach(el => el.classList.remove('hidden'));
                
                // Show/hide appropriate buttons
                templateItem.querySelector('.edit-template-btn').classList.add('hidden');
                templateItem.querySelector('.load-template-btn').classList.add('hidden');
                templateItem.querySelector('.delete-template-btn').classList.add('hidden');
                templateItem.querySelector('.save-template-btn').classList.remove('hidden');
                templateItem.querySelector('.cancel-edit-btn').classList.remove('hidden');
                templateItem.querySelector('.add-field-btn').classList.remove('hidden');
            });
        });

        // Add event listener for cancel edit button
        container.querySelectorAll('.cancel-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateItem = e.target.closest('.template-item');
                
                // Hide edit interface
                templateItem.classList.remove('editing');
                templateItem.querySelectorAll('.template-field-content').forEach(el => el.classList.remove('hidden'));
                templateItem.querySelectorAll('.template-field-edit').forEach(el => el.classList.add('hidden'));
                
                // Show/hide appropriate buttons
                templateItem.querySelector('.edit-template-btn').classList.remove('hidden');
                templateItem.querySelector('.load-template-btn').classList.remove('hidden');
                templateItem.querySelector('.delete-template-btn').classList.remove('hidden');
                templateItem.querySelector('.save-template-btn').classList.add('hidden');
                templateItem.querySelector('.cancel-edit-btn').classList.add('hidden');
                templateItem.querySelector('.add-field-btn').classList.add('hidden');
            });
        });

        // Add event listener for save template button
        container.querySelectorAll('.save-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateItem = e.target.closest('.template-item');
                const templateId = templateItem.dataset.templateId;
                const template = this.customTemplates.find(t => t.id === templateId);
                
                if (template) {
                    // Update template schema with edited values
                    const newSchema = {};
                    templateItem.querySelectorAll('.template-field').forEach(field => {
                        const nameInput = field.querySelector('.field-name-input');
                        const valueInput = field.querySelector('.field-value-input');
                        const typeSelect = field.querySelector('.field-type-select');
                        
                        if (nameInput && valueInput && nameInput.value) {
                            const value = this.parseFieldValue(valueInput.value, typeSelect.value);
                            newSchema[nameInput.value] = value;
                        }
                    });
                    
                    template.schema = newSchema;
                    this.saveCustomTemplate(template);
                    
                    // Exit edit mode
                    templateItem.classList.remove('editing');
                    templateItem.querySelectorAll('.template-field-content').forEach(el => el.classList.remove('hidden'));
                    templateItem.querySelectorAll('.template-field-edit').forEach(el => el.classList.add('hidden'));
                    
                    // Show/hide appropriate buttons
                    templateItem.querySelector('.edit-template-btn').classList.remove('hidden');
                    templateItem.querySelector('.load-template-btn').classList.remove('hidden');
                    templateItem.querySelector('.delete-template-btn').classList.remove('hidden');
                    templateItem.querySelector('.save-template-btn').classList.add('hidden');
                    templateItem.querySelector('.cancel-edit-btn').classList.add('hidden');
                    templateItem.querySelector('.add-field-btn').classList.add('hidden');
                    
                    this.showToast('Template updated successfully');
                    this.renderCustomTemplatesList();
                }
            });
        });

        // Add event listener for add field button
        container.querySelectorAll('.add-field-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateItem = e.target.closest('.template-item');
                const fieldsContainer = templateItem.querySelector('.template-item-fields');
                
                const newField = document.createElement('div');
                newField.className = 'template-field';
                newField.innerHTML = `
                    <div class="template-field-edit">
                        <input type="text" class="form-control field-name-input" placeholder="Field name">
                        <input type="text" class="form-control field-value-input" placeholder="Field value">
                        <select class="form-control field-type-select">
                            <option value="string">Text</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="array">Array</option>
                            <option value="object">Object</option>
                        </select>
                        <button class="btn btn--outline btn--sm remove-field-btn">Remove</button>
                    </div>
                `;
                
                fieldsContainer.appendChild(newField);
                newField.querySelector('.field-name-input').focus();
            });
        });

        // Add event delegation for remove field button
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-field-btn')) {
                const field = e.target.closest('.template-field');
                if (field) {
                    field.remove();
                }
            }
        });
    }

    bindEventListeners() {
        // Logo click for reset/refresh
        const logoElement = document.getElementById('appLogo');
        if (logoElement) {
            logoElement.addEventListener('click', () => {
                this.resetApp();
            });
        }

        // Save template button
        document.getElementById('saveTemplateBtn').addEventListener('click', () => {
            document.getElementById('saveTemplateModal').classList.remove('hidden');
        });

        // Manage templates button
        document.getElementById('manageTemplatesBtn').addEventListener('click', () => {
            this.renderCustomTemplatesList();
            document.getElementById('manageTemplatesModal').classList.remove('hidden');
        });

        // Save template modal events
        document.getElementById('saveTemplateModalClose').addEventListener('click', () => {
            document.getElementById('saveTemplateModal').classList.add('hidden');
        });

        document.getElementById('saveTemplateModalCancel').addEventListener('click', () => {
            document.getElementById('saveTemplateModal').classList.add('hidden');
        });

        document.getElementById('saveTemplateModalSave').addEventListener('click', () => {
            const name = document.getElementById('templateName').value.trim();
            const category = document.getElementById('templateCategory').value.trim();
            const description = document.getElementById('templateDescription').value.trim();
            const modal = document.getElementById('saveTemplateModal');

            if (!name) {
                this.showToast('Please enter a template name');
                return;
            }

            const template = {
                id: modal.dataset.editingTemplateId || 'custom_' + Date.now(),
                name: name,
                category: category || 'Custom',
                description: description,
                schema: {}
            };

            // Convert current fields to schema
            this.fields.forEach(field => {
                if (field.name) {
                    template.schema[field.name] = field.value;
                }
            });

            this.saveCustomTemplate(template);
            document.getElementById('saveTemplateModal').classList.add('hidden');
            
            // Clear the editing template ID
            delete document.getElementById('saveTemplateModal').dataset.editingTemplateId;
            
            this.showToast('Template saved successfully');

            // Reset the form
            document.getElementById('templateName').value = '';
            document.getElementById('templateCategory').value = '';
            document.getElementById('templateDescription').value = '';
            
            // Update the custom templates list if it's visible
            if (!document.getElementById('manageTemplatesModal').classList.contains('hidden')) {
                this.renderCustomTemplatesList();
            }
        });

        // Manage templates modal events
        document.getElementById('manageTemplatesModalClose').addEventListener('click', () => {
            document.getElementById('manageTemplatesModal').classList.add('hidden');
        });

        document.getElementById('manageTemplatesModalClose2').addEventListener('click', () => {
            document.getElementById('manageTemplatesModal').classList.add('hidden');
        });

        // Settings modal events
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        document.getElementById('settingsModalClose').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('hidden');
        });

        document.getElementById('settingsModalCancel').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('hidden');
        });

        document.getElementById('settingsModalSave').addEventListener('click', () => {
            this.saveSettings();
            this.updateAIButtonText();
        });

        // Update AI button text when model is changed in settings
        document.getElementById('defaultAIModel').addEventListener('change', () => {
            this.updateAIButtonText();
        });

        // Template selection
        document.getElementById('templateSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadTemplate(e.target.value);
            }
        });

        // Add field buttons
        document.getElementById('addFieldBtn').addEventListener('click', () => {
            this.addField();
        });

        document.getElementById('addFieldBottomBtn').addEventListener('click', () => {
            this.addField();
        });

        // Clear all button
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllFields();
        });

        // Field type buttons
        document.querySelectorAll('.field-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.addFieldOfType(type);
            });
        });

        // JSON Preview actions
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyToClipboard();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadJSON();
        });

        document.getElementById('chatgptBtn').addEventListener('click', () => {
            this.openInChatGPT();
        });

        // Modal events
        document.getElementById('modalClose').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modalCancel').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modalSave').addEventListener('click', () => {
            this.saveFieldChanges();
        });

        // Close modal on backdrop click
        document.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.closeModal();
        });
    }

    resetApp() {
        this.clearAllFields();
        document.getElementById('templateSelect').value = '';
        localStorage.removeItem('lastUsedTemplate'); // Clear the last used template
        this.loadDefaultTemplate();
        this.showToast('App reset to default state');
        
        // Clear any editing state
        document.getElementById('saveTemplateModal').dataset.editingTemplateId = '';
        document.getElementById('templateName').value = '';
        document.getElementById('templateCategory').value = '';
        document.getElementById('templateDescription').value = '';
    }

    loadDefaultTemplate() {
        // Try to load the last used template from localStorage
        const lastUsedTemplate = localStorage.getItem('lastUsedTemplate');
        
        if (lastUsedTemplate) {
            // Check if the template still exists (either built-in or custom)
            const template = this.templates.find(t => t.id === lastUsedTemplate) ||
                           this.customTemplates.find(t => t.id === lastUsedTemplate);
            
            if (template) {
                document.getElementById('templateSelect').value = lastUsedTemplate;
                this.loadTemplate(lastUsedTemplate);
                return;
            }
        }
        
        // If no last used template or it doesn't exist anymore, load code generation template
        document.getElementById('templateSelect').value = 'code-generation';
        this.loadTemplate('code-generation');
    }

    loadTemplate(templateId) {
        if (!templateId) return;

        const template = this.templates.find(t => t.id === templateId) || 
                        this.customTemplates.find(t => t.id === templateId);
        if (!template) return;
        
        // Save the template ID as the last used template
        localStorage.setItem('lastUsedTemplate', templateId);

        // Clear existing fields first
        this.fields = [];

        // Convert template schema to fields
        Object.entries(template.schema).forEach(([key, value]) => {
            const fieldType = this.getFieldType(value);
            this.fields.push({
                id: this.generateId(),
                name: key,
                value: value,
                type: fieldType,
                required: key === 'task' // Make task required by default
            });
        });

        this.renderFields();
        this.updateJSONPreview();
        this.showToast(`Loaded ${template.name} template`);
    }

    getFieldType(value) {
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object' && value !== null) return 'object';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'number') return 'number';
        return 'string';
    }

    addField() {
        const field = {
            id: this.generateId(),
            name: '',
            value: '',
            type: 'string',
            required: false
        };
        this.fields.push(field);
        this.renderFields();
        this.updateJSONPreview();
        
        // Focus on the new field name input
        setTimeout(() => {
            const lastField = document.querySelector('.field-card:last-child .field-name-input');
            if (lastField) lastField.focus();
        }, 100);
    }

    addFieldOfType(type) {
        const defaultValues = {
            string: '',
            number: 0,
            boolean: false,
            array: [],
            object: {}
        };

        const field = {
            id: this.generateId(),
            name: '',
            value: defaultValues[type],
            type: type,
            required: false
        };
        this.fields.push(field);
        this.renderFields();
        this.updateJSONPreview();
        
        // Focus on the new field name input
        setTimeout(() => {
            const lastField = document.querySelector('.field-card:last-child .field-name-input');
            if (lastField) lastField.focus();
        }, 100);
    }

    clearAllFields() {
        this.fields = [];
        this.renderFields();
        this.updateJSONPreview();
        document.getElementById('templateSelect').value = '';
        this.showToast('All fields cleared');
    }

    deleteField(fieldId) {
        this.fields = this.fields.filter(f => f.id !== fieldId);
        this.renderFields();
        this.updateJSONPreview();
        this.showToast('Field deleted');
    }

    renderFields() {
        const container = document.getElementById('fieldsContainer');
        
        if (this.fields.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No fields yet</h3>
                    <p>Add your first field to start building your JSON prompt</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.fields.map(field => this.createFieldHTML(field)).join('');
        
        // Bind events for the rendered fields
        this.bindFieldEvents();
    }

    createFieldHTML(field) {
        const valueInput = this.createValueInput(field);
        const requiredBadge = field.required ? '<span class="status status--error">Required</span>' : '';
        
        return `
            <div class="field-card" data-field-id="${field.id}">
                <div class="field-header">
                    <div class="field-info">
                        <input type="text" 
                               class="field-name-input" 
                               value="${this.escapeHtml(field.name)}" 
                               placeholder="Field name"
                               style="border: none; background: transparent; font-weight: 600; font-size: 16px; width: 100%; padding: 4px 0;">
                        <div class="field-type" style="margin-top: 4px;">
                            <span style="text-transform: capitalize; color: #6B7280;">${field.type}</span>
                            ${requiredBadge}
                        </div>
                    </div>
                    <div class="field-actions">
                        <button class="btn btn--outline btn--sm edit-field-btn">Edit</button>
                        <button class="delete-field-btn" title="Delete field">×</button>
                        <div class="drag-handle">⋮⋮</div>
                    </div>
                </div>
                <div class="field-content">
                    ${valueInput}
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    createValueInput(field) {
        switch (field.type) {
            case 'boolean':
                return `
                    <select class="field-value-input form-control">
                        <option value="true" ${field.value === true ? 'selected' : ''}>True</option>
                        <option value="false" ${field.value === false ? 'selected' : ''}>False</option>
                    </select>
                `;
            case 'number':
                return `
                    <input type="number" 
                           class="field-value-input form-control" 
                           value="${field.value}" 
                           placeholder="Enter number">
                `;
            case 'array':
                const arrayValue = Array.isArray(field.value) ? field.value.join(', ') : '';
                return `
                    <input type="text" 
                           class="field-value-input form-control" 
                           value="${this.escapeHtml(arrayValue)}" 
                           placeholder="Comma-separated values">
                `;
            case 'object':
                const objectValue = typeof field.value === 'object' ? JSON.stringify(field.value) : '';
                return `
                    <textarea class="field-value-input form-control" 
                              rows="2" 
                              placeholder="JSON object">${this.escapeHtml(objectValue)}</textarea>
                `;
            default: // string
                return `
                    <input type="text" 
                           class="field-value-input form-control" 
                           value="${this.escapeHtml(field.value)}" 
                           placeholder="Enter value">
                `;
        }
    }

    bindFieldEvents() {
        // Initialize drag functionality
        this.initializeDragAndDrop();

        // Field name inputs
        document.querySelectorAll('.field-name-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const fieldId = e.target.closest('.field-card').dataset.fieldId;
                const field = this.fields.find(f => f.id === fieldId);
                if (field) {
                    field.name = e.target.value;
                    this.updateJSONPreview();
                }
            });
        });

        // Field value inputs
        document.querySelectorAll('.field-value-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const fieldId = e.target.closest('.field-card').dataset.fieldId;
                const field = this.fields.find(f => f.id === fieldId);
                if (field) {
                    field.value = this.parseFieldValue(e.target.value, field.type);
                    this.updateJSONPreview();
                }
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-field-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fieldId = e.target.closest('.field-card').dataset.fieldId;
                this.deleteField(fieldId);
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-field-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fieldId = e.target.closest('.field-card').dataset.fieldId;
                this.editField(fieldId);
            });
        });
    }

    parseFieldValue(value, type) {
        switch (type) {
            case 'boolean':
                return value === 'true';
            case 'number':
                return parseFloat(value) || 0;
            case 'array':
                return value ? value.split(',').map(v => v.trim()).filter(v => v) : [];
            case 'object':
                try {
                    return JSON.parse(value);
                } catch {
                    return {};
                }
            default:
                return value;
        }
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('settings');
        return savedSettings ? JSON.parse(savedSettings) : {
            defaultAIModel: 'chatgpt'
        };
    }

    saveSettings() {
        const aiModel = document.getElementById('defaultAIModel').value;
        this.settings = {
            ...this.settings,
            defaultAIModel: aiModel
        };
        localStorage.setItem('settings', JSON.stringify(this.settings));
        document.getElementById('settingsModal').classList.add('hidden');
        this.showToast('Settings saved successfully');
    }

    openSettings() {
        // Load current settings into the form
        document.getElementById('defaultAIModel').value = this.settings.defaultAIModel || 'chatgpt';
        document.getElementById('settingsModal').classList.remove('hidden');
    }

    editField(fieldId) {
        const field = this.fields.find(f => f.id === fieldId);
        if (!field) return;

        this.currentEditingField = fieldId;
        
        // Populate modal
        document.getElementById('modalFieldName').value = field.name;
        document.getElementById('modalFieldType').value = field.type;
        document.getElementById('modalFieldRequired').checked = field.required;
        
        // Handle value based on type
        let displayValue = field.value;
        if (field.type === 'array' && Array.isArray(field.value)) {
            displayValue = field.value.join(', ');
        } else if (field.type === 'object') {
            displayValue = JSON.stringify(field.value);
        }
        document.getElementById('modalFieldValue').value = displayValue;
        
        // Show modal
        document.getElementById('fieldModal').classList.remove('hidden');
    }

    saveFieldChanges() {
        if (!this.currentEditingField) return;

        const field = this.fields.find(f => f.id === this.currentEditingField);
        if (!field) return;

        const name = document.getElementById('modalFieldName').value;
        const type = document.getElementById('modalFieldType').value;
        const value = document.getElementById('modalFieldValue').value;
        const required = document.getElementById('modalFieldRequired').checked;

        field.name = name;
        field.type = type;
        field.required = required;
        field.value = this.parseFieldValue(value, type);

        this.renderFields();
        this.updateJSONPreview();
        this.closeModal();
        this.showToast('Field updated');
    }

    closeModal() {
        document.getElementById('fieldModal').classList.add('hidden');
        this.currentEditingField = null;
    }

    updateJSONPreview() {
        const jsonObject = {};
        
        this.fields.forEach(field => {
            if (field.name) {
                jsonObject[field.name] = field.value;
            }
        });

        const jsonString = JSON.stringify(jsonObject, null, 2);
        const highlightedJSON = this.highlightJSON(jsonString);
        
        document.getElementById('jsonOutput').innerHTML = highlightedJSON;
        
        // Update validation status
        const validationMessage = document.getElementById('validationMessage');
        try {
            JSON.parse(jsonString);
            validationMessage.className = 'status status--success';
            validationMessage.innerHTML = '<span class="icon">✓</span>Valid JSON';
        } catch (error) {
            validationMessage.className = 'status status--error';
            validationMessage.innerHTML = '<span class="icon">✗</span>Invalid JSON';
        }
    }

    highlightJSON(jsonString) {
        return jsonString
            .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
            .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
            .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
            .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/: null/g, ': <span class="json-null">null</span>');
    }

    async copyToClipboard() {
        const jsonObject = {};
        this.fields.forEach(field => {
            if (field.name) {
                jsonObject[field.name] = field.value;
            }
        });

        const jsonString = JSON.stringify(jsonObject, null, 2);
        
        try {
            await navigator.clipboard.writeText(jsonString);
            this.showToast('JSON copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = jsonString;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('JSON copied to clipboard!');
        }
    }

    downloadJSON() {
        const jsonObject = {};
        this.fields.forEach(field => {
            if (field.name) {
                jsonObject[field.name] = field.value;
            }
        });

        const jsonString = JSON.stringify(jsonObject, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prompt.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('JSON file downloaded!');
    }

    getAIModelInfo(model) {
        const modelInfo = {
            'chatgpt': {
                name: 'ChatGPT',
                icon: '🤖',
                url: 'https://chat.openai.com/?q=',
                toast: 'Opening in ChatGPT...'
            },
            'gemini': {
                name: 'Gemini',
                icon: '🌟',
                url: 'https://gemini.google.com/app?q=',
                toast: 'Opening in Google Gemini...'
            },
            'claude': {
                name: 'Claude',
                icon: '🧠',
                url: 'https://claude.ai/chat?q=',
                toast: 'Opening in Claude...'
            },
            'copilot': {
                name: 'Copilot',
                icon: '👨‍💻',
                url: 'https://copilot.microsoft.com/?q=',
                toast: 'Opening in GitHub Copilot...'
            }
        };
        return modelInfo[model] || modelInfo['chatgpt'];
    }

    updateAIButtonText() {
        const aiModel = this.settings.defaultAIModel || 'chatgpt';
        const modelInfo = this.getAIModelInfo(aiModel);
        const button = document.getElementById('chatgptBtn');
        button.innerHTML = `
            <span class="icon">${modelInfo.icon}</span>
            Open in ${modelInfo.name}
        `;
    }

    openInChatGPT() {
        const jsonObject = {};
        this.fields.forEach(field => {
            if (field.name) {
                jsonObject[field.name] = field.value;
            }
        });

        const jsonString = JSON.stringify(jsonObject, null, 2);
        const encodedPrompt = encodeURIComponent(jsonString);
        
        // Get the current AI model from settings
        const aiModel = this.settings.defaultAIModel || 'chatgpt';
        const modelInfo = this.getAIModelInfo(aiModel);
        
        const url = modelInfo.url + encodedPrompt;
        window.open(url, '_blank');
        this.showToast(modelInfo.toast);
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    generateId() {
        return 'field_' + Math.random().toString(36).substr(2, 9);
    }

    initializeDragAndDrop() {
        const container = document.getElementById('fieldsContainer');
        const fieldCards = container.querySelectorAll('.field-card');
        let draggedCard = null;
        let placeholder = null;
        let dragStartY = 0;

        const createPlaceholder = (height) => {
            const el = document.createElement('div');
            el.className = 'field-card-placeholder';
            el.style.height = height + 'px';
            return el;
        };

        const updateDropIndicator = (e, card) => {
            const rect = card.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                card.classList.add('drop-above');
                card.classList.remove('drop-below');
            } else {
                card.classList.add('drop-below');
                card.classList.remove('drop-above');
            }
        };
        
        fieldCards.forEach(card => {
            const dragHandle = card.querySelector('.drag-handle');
            
            if (dragHandle) {
                dragHandle.addEventListener('mousedown', () => {
                    card.draggable = true;
                });
                
                dragHandle.addEventListener('mouseup', () => {
                    card.draggable = false;
                });
            }

            card.addEventListener('dragstart', (e) => {
                draggedCard = card;
                dragStartY = e.clientY;
                
                // Create and insert placeholder
                placeholder = createPlaceholder(card.offsetHeight);
                card.parentNode.insertBefore(placeholder, card.nextSibling);
                
                // Add dragging styles
                container.classList.add('dragging-active');
                card.classList.add('dragging');
                
                e.dataTransfer.setData('text/plain', card.dataset.fieldId);
                
                // Set custom drag image
                if (e.dataTransfer.setDragImage) {
                    const rect = card.getBoundingClientRect();
                    e.dataTransfer.setDragImage(card, rect.width / 2, rect.height / 2);
                }

                // Remove drop indicators from all cards
                document.querySelectorAll('.field-card').forEach(c => {
                    c.classList.remove('drop-above', 'drop-below');
                });

                // Delay to ensure proper animation
                requestAnimationFrame(() => {
                    card.style.opacity = '0.9';
                });
            });

            card.addEventListener('dragend', (e) => {
                // Remove all temporary elements and classes
                container.classList.remove('dragging-active');
                card.classList.remove('dragging');
                card.style.opacity = '';
                
                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.removeChild(placeholder);
                }
                
                document.querySelectorAll('.field-card').forEach(c => {
                    c.classList.remove('drop-above', 'drop-below');
                });

                // Add dropping animation
                card.classList.add('dropping');
                setTimeout(() => {
                    card.classList.remove('dropping');
                }, 300);

                draggedCard = null;
                placeholder = null;
            });

            card.addEventListener('dragenter', (e) => {
                e.preventDefault();
                if (card !== draggedCard) {
                    updateDropIndicator(e, card);
                }
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (card !== draggedCard) {
                    updateDropIndicator(e, card);
                    
                    const rect = card.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;

                    if (e.clientY < midY) {
                        if (card.previousElementSibling !== draggedCard) {
                            card.parentNode.insertBefore(draggedCard, card);
                        }
                    } else {
                        if (card.nextElementSibling !== draggedCard) {
                            card.parentNode.insertBefore(draggedCard, card.nextElementSibling);
                        }
                    }

                    // Update the fields array order
                    const newOrder = [...container.querySelectorAll('.field-card')].map(c => c.dataset.fieldId);
                    this.fields.sort((a, b) => {
                        return newOrder.indexOf(a.id) - newOrder.indexOf(b.id);
                    });
                    
                    this.updateJSONPreview();
                }
            });

            card.addEventListener('dragleave', (e) => {
                card.classList.remove('drop-above', 'drop-below');
            });
        });

        // Handle container dragover for empty state
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const cards = container.querySelectorAll('.field-card:not(.dragging)');
            if (cards.length === 0) {
                container.appendChild(draggedCard);
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JSONPromptGenerator();
});