// script.js

// Initialize Sortable.js on the field types (toolbar)
new Sortable(document.querySelector('#field-types ul'), {
    group: {
        name: 'shared',
        pull: 'clone', // Allow cloning items from the toolbar
        put: false // Do not allow items to be added to the toolbar
    },
    animation: 150,
    sort: false // Disable sorting within the toolbar
});

// Initialize Sortable.js on the form editor
new Sortable(document.getElementById('form-editor'), {
    group: {
        name: 'shared',
        pull: true,
        put: true
    },
    animation: 150,
    ghostClass: 'ghost',
    onAdd: function (evt) {
        // Get the type of field being added
        const fieldType = evt.item.getAttribute('data-type');
        if (fieldType) {
            // Replace the placeholder with the actual form field
            const fieldWrapper = createFormField(fieldType);
            // Replace the placeholder li element with the new field
            evt.item.parentNode.replaceChild(fieldWrapper, evt.item);
        }
    }
});

// Function to create a form field element with editable title, cog icon, and delete icon
function createFormField(fieldType) {
    const fieldWrapper = document.createElement('li');
    fieldWrapper.setAttribute('data-type', fieldType);

    const titleWrapper = document.createElement('div');
    titleWrapper.classList.add('title-wrapper'); // Use flex to align title and buttons in one line

    const title = document.createElement('div');
    title.classList.add('field-title');
    title.contentEditable = true;
    title.innerText = fieldType.charAt(0).toUpperCase() + fieldType.slice(1) + ' Field'; // Default title

    const buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('button-wrapper'); // Wrapper for the globe, cog, and delete icons

    // 🌐 Globe Icon (URI search)
    const globeIcon = document.createElement('span');
    globeIcon.classList.add('globe-icon');
    globeIcon.innerHTML = '🌐';
    globeIcon.addEventListener('click', () => openURISearchModal(fieldType, title));

    // ⚙️ Cog Icon
    const cogIcon = document.createElement('span');
    cogIcon.classList.add('cog-icon');
    cogIcon.innerHTML = '⚙️';
    cogIcon.addEventListener('click', function() {
        toggleSettingsMenu(fieldWrapper);
    });

    // ❌ Delete Icon
    const deleteIcon = document.createElement('span');
    deleteIcon.classList.add('delete-icon');
    deleteIcon.innerHTML = '❌';
    deleteIcon.addEventListener('click', function() {
        fieldWrapper.remove(); // Delete the field
    });

    // Settings Menu
    const settingsMenu = document.createElement('div');
    settingsMenu.classList.add('settings-menu');
    settingsMenu.innerHTML = generateSettingsMenu(fieldType);

    // Append title and button icons to the titleWrapper
    titleWrapper.appendChild(title);
    buttonWrapper.appendChild(globeIcon);  // Append the globe icon to the wrapper
    buttonWrapper.appendChild(cogIcon);    // Append the cog icon to the wrapper
    buttonWrapper.appendChild(deleteIcon); // Append the delete icon to the wrapper
    titleWrapper.appendChild(buttonWrapper); // Add the button wrapper to the title wrapper

    // Append the title wrapper and settings menu to the field wrapper
    fieldWrapper.appendChild(titleWrapper);
    fieldWrapper.appendChild(settingsMenu);

    return fieldWrapper;
}

// Function to generate the settings menu based on the field type
function generateSettingsMenu(fieldType) {
    let menu = '';
    switch (fieldType) {
        case 'text':
            menu += `<label>Min Length: <input type="number" name="min-length"></label><br>`;
            menu += `<label>Max Length: <input type="number" name="max-length"></label><br>`;
            menu += `<label>Pattern: <input type="text" name="pattern" placeholder="Regex pattern"></label><br>`;
            break;
        case 'number':
            menu += `
                <label>Number Type: 
                    <select name="number-type">
                        <option value="integer">Integer</option>
                        <option value="float">Float</option>
                    </select>
                </label><br>
                <label>Min Value: <input type="number" name="min-value"></label><br>
                <label>Max Value: <input type="number" name="max-value"></label><br>
            `;
            break;
        case 'date':
            menu += `<label>Min Date: <input type="date" name="min-date"></label><br>`;
            menu += `<label>Max Date: <input type="date" name="max-date"></label><br>`;
            break;
        case 'datetime':
            menu += `<label>Min DateTime: <input type="datetime-local" name="min-datetime"></label><br>`;
            menu += `<label>Max DateTime: <input type="datetime-local" name="max-datetime"></label><br>`;
            break;
        case 'boolean':
            menu += `<label>Default Value: <select name="default-boolean">
                        <option value="true">True</option>
                        <option value="false">False</option>
                     </select></label><br>`;
            break;
        case 'uri':
            menu += `<label>Pattern (URI format): <input type="text" name="uri-pattern" placeholder="URI pattern"></label><br>`;
            break;
        case 'select':
            menu += `<label>Options (comma separated): <input type="text" name="options" placeholder="Option1, Option2"></label><br>`;
            break;
    }

    // Add the "Optional?" and "Multifield?" options as before
    menu += `
        <div class="horizontal-bar">
            <label><input type="checkbox" name="optional"> Optional?</label>
            <label><input type="checkbox" name="multifield"> Multifield?</label>
        </div>
        <div id="multifield-options" style="display:none;">
            <label>Min Count: <input type="number" name="min-count"></label><br>
            <label>Max Count: <input type="number" name="max-count"></label><br>
        </div>
    `;

    return menu;
}

// Handle visibility of min/max count inputs when "Multifield?" is checked
document.addEventListener('change', function (e) {
    if (e.target.name === 'multifield') {
        const multifieldOptions = e.target.closest('.settings-menu').querySelector('#multifield-options');
        multifieldOptions.style.display = e.target.checked ? 'block' : 'none';
    }
});

// Function to toggle the visibility of the settings menu
function toggleSettingsMenu(fieldWrapper) {
    const settingsMenu = fieldWrapper.querySelector('.settings-menu');
    if (settingsMenu.style.display === 'block') {
        settingsMenu.style.display = 'none';
    } else {
        settingsMenu.style.display = 'block';
    }
}

function openURISearchModal(fieldType, titleElement) {
    const modal = document.createElement('div');
    modal.classList.add('uri-modal');

    const modalContent = `
        <div class="uri-modal-content">
            <div class="uri-modal-header">
                <h2>Select URI for ${fieldType}</h2>
                <span class="uri-modal-close">×</span>
            </div>
            <ul class="uri-repo-list">
                <li data-uri="http://www.w3.org/2001/XMLSchema#">XSD (XML Schema)</li>
                <li data-uri="http://purl.org/pav/">PAV (Provenance, Authoring, Versioning)</li>
                <li data-uri="http://purl.org/ontology/bibo/">BIBO (Bibliographic Ontology)</li>
                <li data-uri="http://purl.org/dc/terms/">DCT (Dublin Core Terms)</li>
                <li data-uri="http://open-services.net/ns/core#">OSLC (Open Services for Lifecycle Collaboration)</li>
                <li data-uri="http://schema.org/">Schema.org</li>
                <li data-uri="http://www.w3.org/2004/02/skos/core#">SKOS (Simple Knowledge Organization System)</li>
            </ul>
        </div>
    `;

    modal.innerHTML = modalContent;
    document.body.appendChild(modal);

    modal.querySelector('.uri-modal-close').addEventListener('click', () => {
        modal.remove(); // Close the modal
    });

    modal.querySelectorAll('.uri-repo-list li').forEach(item => {
        item.addEventListener('click', () => {
            const uri = item.getAttribute('data-uri');
            titleElement.innerText = uri; // Set the title to the selected URI
            modal.remove(); // Close the modal
        });
    });

    modal.style.display = 'block'; // Show the modal
}

// SHACL Code Generation
document.getElementById('generate-shacl').addEventListener('click', function() {
    const fields = document.querySelectorAll('#form-editor li');
    let shaclCode = `@prefix sh: <http://www.w3.org/ns/shacl#> .\n@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n@prefix dcat: <http://www.w3.org/ns/dcat#> .\n\n`;

    // Add the dataset shape header
    shaclCode += `:DatasetShape a sh:NodeShape ;\n`;
    shaclCode += `    sh:targetClass dcat:Dataset ;\n`;

    fields.forEach((fieldWrapper, index) => {
        const fieldType = fieldWrapper.getAttribute('data-type');
        const title = fieldWrapper.querySelector('.field-title').innerText;
        let fieldName = title.replace(/\s+/g, '_').toLowerCase(); // Generate a valid property name
        let datatype;

        // Determine the appropriate datatype based on the field type
        switch (fieldType) {
            case 'text':
                datatype = 'xsd:string';
                break;
            case 'number':
                // Handle number type (integer or float)
                const numberType = fieldWrapper.querySelector('select[name="number-type"]').value;
                if (numberType === 'float') {
                    datatype = 'xsd:decimal'; // Float will be treated as decimal in SHACL
                } else {
                    datatype = 'xsd:integer';
                }
                break;
            case 'date':
                datatype = 'xsd:date';
                break;
            case 'datetime':
                datatype = 'xsd:dateTime';
                break;
            case 'boolean':
                datatype = 'xsd:boolean';
                break;
            case 'uri':
                datatype = 'xsd:anyURI';
                break;
            case 'select':
                datatype = 'xsd:string';
                break;
            default:
                datatype = 'xsd:string';
        }

        // Add the property shape for each field
        shaclCode += `    sh:property [\n`;
        shaclCode += `        sh:path :${fieldName} ;\n`;
        shaclCode += `        sh:datatype ${datatype} ;\n`;

        // Add additional constraints based on user input
        const settingsMenu = fieldWrapper.querySelector('.settings-menu');
        if (fieldType === 'text') {
            const minLength = settingsMenu.querySelector('input[name="min-length"]').value;
            const maxLength = settingsMenu.querySelector('input[name="max-length"]').value;
            const pattern = settingsMenu.querySelector('input[name="pattern"]').value;
            if (minLength) shaclCode += `        sh:minLength ${minLength} ;\n`;
            if (maxLength) shaclCode += `        sh:maxLength ${maxLength} ;\n`;
            if (pattern) shaclCode += `        sh:pattern "${pattern}" ;\n`;
        }
        if (fieldType === 'number') {
            const minValue = settingsMenu.querySelector('input[name="min-value"]').value;
            const maxValue = settingsMenu.querySelector('input[name="max-value"]').value;
            if (minValue) shaclCode += `        sh:minInclusive ${minValue} ;\n`;
            if (maxValue) shaclCode += `        sh:maxInclusive ${maxValue} ;\n`;
        }
        if (fieldType === 'date' || fieldType === 'datetime') {
            const minDate = settingsMenu.querySelector('input[name="min-date"], input[name="min-datetime"]').value;
            const maxDate = settingsMenu.querySelector('input[name="max-date"], input[name="max-datetime"]').value;
            if (minDate) shaclCode += `        sh:minInclusive "${minDate}"^^xsd:${fieldType === 'date' ? 'date' : 'dateTime'} ;\n`;
            if (maxDate) shaclCode += `        sh:maxInclusive "${maxDate}"^^xsd:${fieldType === 'date' ? 'date' : 'dateTime'} ;\n`;
        }
        if (fieldType === 'boolean') {
            const defaultBoolean = settingsMenu.querySelector('select[name="default-boolean"]').value;
            if (defaultBoolean) shaclCode += `        sh:defaultValue "${defaultBoolean}"^^xsd:boolean ;\n`;
        }
        if (fieldType === 'uri') {
            const uriPattern = settingsMenu.querySelector('input[name="uri-pattern"]').value;
            if (uriPattern) shaclCode += `        sh:pattern "${uriPattern}" ;\n`;
        }
        if (fieldType === 'select') {
            const options = settingsMenu.querySelector('input[name="options"]').value.split(',').map(opt => opt.trim());
            if (options.length > 0) {
                shaclCode += `        sh:in ( ${options.map(opt => `"${opt}"`).join(' ')} ) ;\n`;
            }
        }
        
        // Handle "Optional?" option
        const isOptional = settingsMenu.querySelector('input[name="optional"]').checked;
        let minCount = 1; // Default minCount is 1
        let maxCount = 1; // Default maxCount is 1

        if (isOptional) {
            minCount = 0; // If optional, set minCount to 0
        }

        // Handle "Multifield?" option
        const isMultifield = settingsMenu.querySelector('input[name="multifield"]').checked;
        if (isMultifield) {
            // If multifield is checked, use the user's input values for minCount and maxCount
            const userMinCount = settingsMenu.querySelector('input[name="min-count"]').value;
            const userMaxCount = settingsMenu.querySelector('input[name="max-count"]').value;
            minCount = userMinCount ? parseInt(userMinCount) : minCount; // If no input, fallback to default
            maxCount = userMaxCount ? parseInt(userMaxCount) : maxCount; // If no input, fallback to default
        }

        // Add minCount and maxCount constraints to the SHACL code
        shaclCode += `        sh:minCount ${minCount} ;\n`;
        shaclCode += `        sh:maxCount ${maxCount} ;\n`;

        shaclCode += `    ] ;\n`;
    });

    // Remove trailing semicolon from the last property and add a period to end the shape definition
    shaclCode = shaclCode.trim().replace(/;$/, '.') + '\n';

    document.getElementById('shacl-output').textContent = shaclCode;
});
