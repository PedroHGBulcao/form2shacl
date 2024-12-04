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
        name: "main-form",
        pull: true,
        put: true
    },
    animation: 150,
    ghostClass: 'ghost',
    draggable: '.group-wrapper, .field-wrapper',
    onAdd: function (evt) {
        // Get the type of field being added
        const oldFieldWrapper = evt.item;
        const isNewField = !oldFieldWrapper.hasAttribute("unique-id");
        const fieldType = evt.item.getAttribute('data-type');
        if (fieldType === "group") {
            const fieldWrapper = createGroupElement();
            evt.item.parentNode.replaceChild(fieldWrapper, evt.item);
        }
        else if (fieldType) {
            const fieldData = isNewField ? {} : serializeFieldData(oldFieldWrapper);
            const fieldWrapper = createFormField(fieldType, fieldData);
            evt.item.parentNode.replaceChild(fieldWrapper, evt.item);
        }
    }
});

// Groups
function createGroupElement() {
    const groupWrapper = document.createElement("div");
    groupWrapper.classList.add("group-wrapper");
    groupWrapper.setAttribute("data-type", "group");

    const headerWrapper = document.createElement("div");
    headerWrapper.classList.add("header-wrapper");

    const inputWrapper = document.createElement("div");
    inputWrapper.classList.add("input-wrapper");

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.classList.add("group-label");
    labelInput.name = "group-label";
    labelInput.placeholder = "Enter group name";

    const uriInput = document.createElement("input");
    uriInput.type = "text";
    uriInput.classList.add("group-uri");
    uriInput.name = "group-uri";
    uriInput.placeholder = "Enter group URI";

    inputWrapper.appendChild(labelInput);
    inputWrapper.appendChild(uriInput);
    headerWrapper.appendChild(inputWrapper)

    // Add a delete button to the group
    const deleteIcon = document.createElement("span");
    deleteIcon.classList.add("delete-icon");
    deleteIcon.innerHTML = "❌";
    deleteIcon.addEventListener("click", function () {
        groupWrapper.remove(); // Remove the group when the delete icon is clicked
    });
    headerWrapper.appendChild(deleteIcon);
    groupWrapper.appendChild(headerWrapper);

    // Drop area within the group for fields
    const dropArea = document.createElement("div");
    dropArea.classList.add("group-drop-area");
    groupWrapper.appendChild(dropArea);

    // Initialize Sortable for the group's drop area
    new Sortable(dropArea, {
        group: {
            name: "group-zone", // Unique group name for group drop areas
            pull: true,
            put: true // Allow fields from the main form to be dropped here
        },
        animation: 150,
        ghostClass: 'ghost',
        filter: 'field-wrapper',
        onAdd: function (event) {
            const oldFieldWrapper = event.item;
            const isNewField = !oldFieldWrapper.hasAttribute("unique-id");
            const fieldType = event.item.getAttribute("data-type");
            if (fieldType != "group"){
                const fieldData = isNewField ? {} : serializeFieldData(oldFieldWrapper);
                const fieldElement = createFormField(fieldType, fieldData);
                dropArea.replaceChild(fieldElement, event.item);
            }
            else event.item.remove(); // Remove the original placeholder item
        }
    });

    return groupWrapper;
}

// Extract field data
function serializeFieldData(fieldWrapper) {
    const fieldType = fieldWrapper.getAttribute("data-type");
    const uniqueId = fieldWrapper.getAttribute("unique-id");
    const configStatus = fieldWrapper.querySelector(".settings-menu").style.display;
    const fieldData = {
        type: fieldType,
        uniqueId: uniqueId,
        title: fieldWrapper.querySelector(".field-title").innerText.trim(),
        configStatus : configStatus,
        inputs: {}
    };

    // Extract inputs and their values
    const settingsMenu = fieldWrapper.querySelector(".settings-menu");
    if (settingsMenu) {
        const inputs = settingsMenu.querySelectorAll("input, select");
        inputs.forEach(input => {
            if (input.type === "checkbox") fieldData.inputs[input.name] = input.checked;
            else if (input.type === "radio"){
                if (input.checked) fieldData.inputs[input.name] = input.value;
            }
            else fieldData.inputs[input.name] = input.value;
        });
    }

    return fieldData;
}

// Function to create a form field element with editable title, cog icon, and delete icon
function createFormField(fieldType, fieldData = {}) {
    const fieldWrapper = document.createElement('li');
    fieldWrapper.setAttribute('data-type', fieldType);
    fieldWrapper.classList.add("field-wrapper");

    const titlePrewrapper = document.createElement('div');
    const titleWrapper = document.createElement('div');
    titlePrewrapper.classList.add('title-prewrapper'); // Use flex to align title and buttons in one line
    titleWrapper.classList.add('title-wrapper'); // Use flex to align title and buttons in one line

    const uniqueId = fieldData.uniqueId || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    fieldWrapper.setAttribute("unique-id", uniqueId);    

    // Field Icon
    const fieldIcon = document.createElement('span');
    fieldIcon.classList.add('field-icon');
    const fieldEmojis = {
        text: "📝",
        number: "🔢",
        date: "📅",
        datetime: "⏰",
        boolean: "✅",
        uri: "🌐",
        select: "🔽"
    };
    fieldIcon.innerHTML = fieldEmojis[fieldType];

    const title = document.createElement('div');
    title.classList.add('field-title');
    title.contentEditable = true;
    title.innerText = fieldData.title || "";

    const buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('button-wrapper'); // Wrapper for the globe, cog, and delete icons

    // 🌐 Globe Icon (URI search)
    const globeIcon = document.createElement('span');
    globeIcon.classList.add('globe-icon');
    globeIcon.innerHTML = '🌐';
    
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
    settingsMenu.innerHTML = generateSettingsMenu(fieldType, uniqueId);
    settingsMenu.style.display = fieldData.configStatus || "none";

    // Populate inputs with fieldData
    Object.entries(fieldData.inputs || {}).forEach(([key, value]) => {
        const input = settingsMenu.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === "checkbox") {
                input.checked = value;
            }
            else if (input.type === "radio"){
                const radioOptions = settingsMenu.querySelectorAll(`[name="${key}"]`);
                radioOptions.forEach((radioOption) => {if(radioOption.value === value) radioOption.checked = true;});
                handleRadioVisibility(settingsMenu.querySelector(`[name="${key}"]:checked`));
            }
            else {
                input.value = value;
            }
        }
    });

    if (fieldType === "text") handleMultifieldCheck(settingsMenu.querySelector(`[name="multifield"]`));

    // Append title and button icons to the titleWrapper
    titlePrewrapper.appendChild(fieldIcon);
    titlePrewrapper.appendChild(title);
    titleWrapper.appendChild(titlePrewrapper);
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
function generateSettingsMenu(fieldType, uniqueId) {
    let menu = '';
    menu += `<label>URI: <input type="text" name="uri-path" placeholder="URI path"></label><br>`;
    menu += `<label>Description: <input type="text" name="description"></label><br>`;
    switch (fieldType) {
        case 'text':
            menu += `<label>Default Value: <input type="text" name="default-value"></label><br><hr>`;
            menu += `<label>Min Length: <input type="number" name="min-length"></label><br>`;
            menu += `<label>Max Length: <input type="number" name="max-length"></label><br>`;
            menu += `<label>Pattern: <input type="text" name="pattern" placeholder="Regex pattern"></label><br>`;
            menu += `<div class="horizontal-bar">
                <label><input type="radio" name="dash-type-${uniqueId}" value="standard" checked> Standard</label>
                <label><input type="radio" name="dash-type-${uniqueId}" value="multiline"> Multiline</label>
                <label><input type="radio" name="dash-type-${uniqueId}" value="rich-text"> Rich Text (HTML)</label>
                <label><input type="radio" name="dash-type-${uniqueId}" value="autocomplete"> Autocomplete</label>
                <label><input type="radio" name="dash-type-${uniqueId}" value="blank"> Blank</label>
                </div>`;
            menu += `<div id="hidden-language" style="display:block;padding-top:5px;text-align: center;">
                <label><input type="checkbox" name="language-selector"> Language Selector?</label>
                </div>`;
            menu += `<div id="hidden-autocomplete" style="display:none;padding-top:5px;text-align: center;">
                <label>Class URI: <input type="text" name="autocomplete-class"></label>
                </div>`;
            break;
        case 'number':
            menu += `<label>Default Value: <input type="number" name="default-value"></label><br><hr>`;
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
            menu += `<label>Default Value: <input type="date" name="default-value"></label><br><hr>`;
            menu += `<label>Min Date: <input type="date" name="min-date"></label><br>`;
            menu += `<label>Max Date: <input type="date" name="max-date"></label><br>`;
            break;
        case 'datetime':
            menu += `<label>Default Value: <input type="datetime-local" name="default-value"></label><br><hr>`;
            menu += `<label>Min DateTime: <input type="datetime-local" name="min-datetime"></label><br>`;
            menu += `<label>Max DateTime: <input type="datetime-local" name="max-datetime"></label><br>`;
            break;
        case 'boolean':
            menu += `<label>Default Value: <select name="default-value">
                        <option value="">None</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select></label><br>`;
            break;
        case 'uri':
            menu += `<label>Default Value: <input type="text" name="default-value" placeholder="URI pattern"></label><br><hr>`;
            menu += `<label>Pattern (URI format): <input type="text" name="uri-pattern" placeholder="URI pattern"></label><br>`;
            menu += `<label>Subclass of (URI format): <input type="text" name="subclass-of-uri" placeholder="URI pattern"></label><br>`;
            break;
        case 'select':
            menu += `<div class="horizontal-bar">
                <label><input type="radio" name="dash-type-${uniqueId}" value="list" checked> Custom list</label>
                <label><input type="radio" name="dash-type-${uniqueId}" value="instance-of"> Instances of class</label>
                </div>`;
            menu += `<div id="custom-list" style="display:block;padding-top:5px;">
                <label>Options (comma separated): <input type="text" name="options" placeholder="Option1, Option2"></label>
                </div>`;
            menu += `<div id="instance-of-uri" style="display:none;padding-top:5px;">
                <label>Instance of (URI): <input type="text" name="instance-of-uri"></label>
                </div>`;
            break;
    }

    // Add the "Optional?" and "Multifield?" options as before
    menu += `
        <div class="horizontal-bar">
            <label><input type="checkbox" name="optional"> Optional?</label>
            <label><input type="checkbox" name="multifield"> Multifield?</label>
        </div>
        <div id="multifield-options" style="display:none;padding-top:5px;">
            <label>Min Count: <input type="number" name="min-count"></label><br>
            <label>Max Count: <input type="number" name="max-count"></label><br>
        </div>
    `;

    return menu;
}

// Handle visibility of radio input field options
document.addEventListener('change', function (e) {
    handleRadioVisibility(e.target);
});

function handleRadioVisibility(tgt){
    if (tgt.type === 'radio') {
        const checked = document.querySelector(`input[name="${tgt.name}"]:checked`).value;
        if (checked === "list" || checked === "instance-of"){
            const customListOption = tgt.closest('.settings-menu').querySelector('#custom-list');
            customListOption.style.display = checked === "list" ? 'block' : 'none';
            const instanceOfOption = tgt.closest('.settings-menu').querySelector('#instance-of-uri');
            instanceOfOption.style.display = checked === "instance-of" ? 'block' : 'none';
        }
        else {
            const languageOption = tgt.closest('.settings-menu').querySelector('#hidden-language');
            languageOption.style.display = (checked === "standard" || checked === "multiline") ? 'block' : 'none';
            const autocompleteOption = tgt.closest('.settings-menu').querySelector('#hidden-autocomplete');
            autocompleteOption.style.display = checked === "autocomplete" ? 'block' : 'none';
        }
    }
}

// Handle visibility of min/max count inputs when "Multifield?" is checked
document.addEventListener('change', function (e) {
    handleMultifieldCheck(e.target);
});

function handleMultifieldCheck(tgt){
    if (tgt.name === 'multifield') {
        const multifieldOptions = tgt.closest('.settings-menu').querySelector('#multifield-options');
        multifieldOptions.style.display = tgt.checked ? 'block' : 'none';
    }
}

// Namespace tab
document.addEventListener("DOMContentLoaded", () => {
    const namespaceList = document.getElementById("namespace-list");
    const addNamespaceButton = document.getElementById("add-namespace");

    let editingNamespace = null; // Track the namespace being edited

    // Load namespaces from the dictionary in the HTML
    const namespaceData = JSON.parse(document.getElementById("namespace-data").textContent);
    const preSelectedPrefixes = ["rdf", "xsd", "sh", "dash", "dcat", "rdfs"]; // Pre-selected namespaces
    for (const [prefix, uri] of Object.entries(namespaceData)) {
        const isSelected = preSelectedPrefixes.includes(prefix);
        addNamespaceToTab(prefix, uri, isSelected, true);
    }

    // Add a custom namespace or replace an existing one
    addNamespaceButton.addEventListener("click", () => {
        const prefix = document.getElementById("namespace-prefix").value.trim();
        const uri = document.getElementById("namespace-uri").value.trim();

        if (prefix && uri) {
            // If editing an existing namespace
            if (editingNamespace) {
                const existingPrefix = editingNamespace.getAttribute("data-prefix");
                const existingUri = editingNamespace.getAttribute("data-uri");

                // Only remove the old namespace if a change is made
                if (prefix !== existingPrefix || uri !== existingUri) {
                    editingNamespace.remove();
                }
                editingNamespace = null; // Clear the editing state
            }

            // Check if the namespace already exists (not in edit mode)
            const existingItem = document.querySelector(`.namespace-item[data-prefix="${prefix}"]`);
            if (existingItem && !editingNamespace) {
                existingItem.setAttribute("data-uri", uri); // Update the URI
            } else {
                // Add a new namespace
                addNamespaceToTab(prefix, uri);
            }

            // Clear the input fields
            document.getElementById("namespace-prefix").value = "";
            document.getElementById("namespace-uri").value = "";
            sortNamespaces(); // Keep namespaces sorted
        }
    });

    // Handle namespace actions: select, edit, delete
    namespaceList.addEventListener("click", (event) => {
        const target = event.target;

        // Delete namespace immediately
        if (target.classList.contains("delete-namespace")) {
            const namespaceItem = target.closest(".namespace-item");
            namespaceItem.remove();
            sortNamespaces(); // Re-sort after deletion
            return; // No further actions needed
        }

        // Edit namespace without selecting it
        if (target.classList.contains("edit-namespace")) {
            const namespaceItem = target.closest(".namespace-item");
            const prefix = namespaceItem.getAttribute("data-prefix");
            const uri = namespaceItem.getAttribute("data-uri");

            // Pre-fill the inputs with the current namespace data
            document.getElementById("namespace-prefix").value = prefix;
            document.getElementById("namespace-uri").value = uri;

            // Set the namespace being edited (but don't remove it yet)
            editingNamespace = namespaceItem;

            // Scroll to the edit zone
            document.getElementById("namespace-add").scrollIntoView({ behavior: "smooth" });
            return; // No further actions needed
        }

        // Select namespace (toggle) and re-sort
        if (target.closest(".namespace-item")) {
            const namespaceItem = target.closest(".namespace-item");
            namespaceItem.classList.toggle("selected");
            sortNamespaces(); // Keep namespaces sorted after selection
        }
    });

    // Function to add a namespace to the tab
    function addNamespaceToTab(prefix, uri, isSelected = false, isFirstLoad = false) {
        const namespaceItem = document.createElement("li");
        namespaceItem.classList.add("namespace-item");
        if (isSelected) {
            namespaceItem.classList.add("selected");
        }
        namespaceItem.setAttribute("data-prefix", prefix);
        namespaceItem.setAttribute("data-uri", uri);
        namespaceItem.innerHTML = `
            ${prefix}
            <span class="namespace-buttons">
                <span class="edit-namespace">⚙️</span>
                <span class="delete-namespace">❌</span>
            </span>
        `;
        namespaceList.appendChild(namespaceItem);
        if (!isFirstLoad) namespaceItem.classList.toggle("selected");
        sortNamespaces(); // Sort namespaces immediately after adding
    }

    // Function to sort namespaces: selected first, all sorted alphabetically
    function sortNamespaces() {
        const items = Array.from(namespaceList.children);
        const selectedItems = items.filter((item) => item.classList.contains("selected"));
        const unselectedItems = items.filter((item) => !item.classList.contains("selected"));

        // Sort each group alphabetically by prefix
        selectedItems.sort((a, b) => {
            const prefixA = a.getAttribute("data-prefix").toLowerCase();
            const prefixB = b.getAttribute("data-prefix").toLowerCase();
            return prefixA.localeCompare(prefixB);
        });

        unselectedItems.sort((a, b) => {
            const prefixA = a.getAttribute("data-prefix").toLowerCase();
            const prefixB = b.getAttribute("data-prefix").toLowerCase();
            return prefixA.localeCompare(prefixB);
        });

        // Append selected first, then unselected
        [...selectedItems, ...unselectedItems].forEach((item) => namespaceList.appendChild(item));
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

// Ontology modal
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("ontology-modal");
    const closeModal = document.querySelector(".close-modal");
    const searchInput = document.getElementById("ontology-search-input");
    const resultsContainer = document.getElementById("ontology-results");
    const loadingSpinner = document.getElementById("loading-spinner");

    let currentFieldWrapper = null; // Track the current field wrapper for updating its URI

    // Open modal when globe button is clicked
    document.addEventListener("click", (event) => {
        if (event.target.classList.contains("globe-icon")) {
            currentFieldWrapper = event.target.closest(".field-wrapper");
            modal.style.display = "block";
        }
    });

    // Close modal
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Close modal when clicking outside the content
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Search LOV API
    searchInput.addEventListener("input", async () => {
        const query = searchInput.value.trim();
        resultsContainer.innerHTML = ""; // Clear previous results

        if (query.length > 2) {
            loadingSpinner.style.display = "block"; // Show loading spinner
            const apiUrl = `https://lov.linkeddata.es/dataset/lov/api/v2/term/search?q=${encodeURIComponent(
                query
            )}`;

            try {
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    loadingSpinner.style.display = "none"; // Hide loading spinner

                    if (data.results && data.results.length > 0) {
                        data.results.forEach((result) => {
                            const conceptElement = document.createElement("div");
                            conceptElement.classList.add("ontology-result");

                            const clickableURI = document.createElement("a");
                            clickableURI.href = result.uri;
                            clickableURI.textContent = result.uri;
                            clickableURI.target = "_blank";
                            clickableURI.style.marginLeft = "5px";
                            
                            conceptElement.textContent = `${result.prefixedName}`;
                            conceptElement.dataset.prefix = result.prefixedName.toString().split(":")[0]; // Extract prefix
                            conceptElement.dataset.concept = result.prefixedName.toString().split(":")[1]; // Extract concept
                            conceptElement.dataset.uri = result.uri;
                            
                            conceptElement.appendChild(clickableURI);
                            resultsContainer.appendChild(conceptElement);
                        });
                    } else {
                        resultsContainer.innerHTML = "<p>No results found.</p>";
                    }
                } else {
                    loadingSpinner.style.display = "none"; // Hide loading spinner
                    resultsContainer.innerHTML = "<p>Error fetching results.</p>";
                }
            } catch (error) {
                console.error("Error fetching data from LOV API:", error);
                loadingSpinner.style.display = "none"; // Hide loading spinner
                resultsContainer.innerHTML = "<p>Error fetching results.</p>";
            }
        }
    });

    // Handle selection of a concept
    resultsContainer.addEventListener("click", (event) => {
        if (event.target.classList.contains("ontology-result")) {
            const selectedPrefix = event.target.dataset.prefix;
            const selectedConcept = event.target.dataset.prefix + ":" + event.target.dataset.concept;
            const selectedURI = event.target.dataset.uri;

            // 1. Open the settings menu of the selected field
            if (currentFieldWrapper) {
                const settingsMenu = currentFieldWrapper.querySelector(".settings-menu");
                if (settingsMenu && (settingsMenu.style.display === 'none' || !settingsMenu.style.display)) settingsMenu.style.display = 'block';

                // 2. Add the clicked result to the URI field in the cog menu
                const uriInput = settingsMenu.querySelector("input[name='uri-path']");
                if (uriInput) {
                    uriInput.value = selectedConcept;
                }
            }

            // 3. Add the prefix to the selected namespaces on the tab
            const namespaceList = document.getElementById("namespace-list");
            const existingNamespace = document.querySelector(
                `.namespace-item[data-prefix="${selectedPrefix}"]`
            );

            if (!existingNamespace) {
                // Add the namespace if it doesn't already exist
                addNamespaceToTab(selectedPrefix, selectedURI, true);
            } else {
                // Ensure it's selected if it already exists
                existingNamespace.classList.add("selected");
                sortNamespaces();
            }

            // Close the modal
            modal.style.display = "none";
        }
    });

    // Function to add a namespace to the tab
    function addNamespaceToTab(prefix, uri, isSelected = false) {
        const namespaceItem = document.createElement("li");
        namespaceItem.classList.add("namespace-item");
        if (isSelected) {
            namespaceItem.classList.add("selected");
        }
        namespaceItem.setAttribute("data-prefix", prefix);
        namespaceItem.setAttribute("data-uri", uri);
        namespaceItem.innerHTML = `
            ${prefix}
            <span class="namespace-buttons">
                <span class="edit-namespace">⚙️</span>
                <span class="delete-namespace">❌</span>
            </span>
        `;
        document.getElementById("namespace-list").appendChild(namespaceItem);
        sortNamespaces();
    }

    // Function to sort namespaces
    function sortNamespaces() {
        const namespaceList = document.getElementById("namespace-list");
        const items = Array.from(namespaceList.children);
        const selectedItems = items.filter((item) => item.classList.contains("selected"));
        const unselectedItems = items.filter((item) => !item.classList.contains("selected"));

        // Sort each group alphabetically by prefix
        selectedItems.sort((a, b) => {
            const prefixA = a.getAttribute("data-prefix").toLowerCase();
            const prefixB = b.getAttribute("data-prefix").toLowerCase();
            return prefixA.localeCompare(prefixB);
        });

        unselectedItems.sort((a, b) => {
            const prefixA = a.getAttribute("data-prefix").toLowerCase();
            const prefixB = b.getAttribute("data-prefix").toLowerCase();
            return prefixA.localeCompare(prefixB);
        });

        // Append selected first, then unselected
        [...selectedItems, ...unselectedItems].forEach((item) => namespaceList.appendChild(item));
    }
});

// Namespace tab toggle
document.addEventListener("DOMContentLoaded", () => {
    const namespaceContainer = document.getElementById("namespace-container");
    const namespaceToggle = document.getElementById("namespace-toggle");
    const toggleButton = document.getElementById("namespace-toggle");

    // Initial state
    let isTabVisible = true;

    // Toggle visibility of the namespace tab
    toggleButton.addEventListener("click", () => {
        isTabVisible = !isTabVisible;

        // Toggle the hidden class and button text
        if (isTabVisible) {
            namespaceContainer.classList.remove("hidden");
            namespaceToggle.classList.remove("hidden");
            toggleButton.firstChild.src = "left.png";
        } else {
            namespaceContainer.classList.add("hidden");
            namespaceToggle.classList.add("hidden");
            toggleButton.firstChild.src = "right.png";
        }
    });
});

function parseUri(text){
    return /[^:\n\r]+:[^:\n\r]+/.test(text) ? text : `<${text}>`;
}

// SHACL Code Generation
document.getElementById('generate-shacl').addEventListener('click', function() {
    const fields = document.querySelectorAll('#form-editor li');
    const namespaces = document.querySelectorAll(".namespace-item.selected");
    let shaclCode = "";
    namespaces.forEach((item) => {
        const prefix = item.getAttribute("data-prefix");
        const uri = item.getAttribute("data-uri");
        shaclCode += `@prefix ${prefix}: <${uri}> .\n`;
    });

    if (shaclCode) shaclCode += '\n';

    // Add the dataset shape header
    shaclCode += `:DatasetShape a sh:NodeShape ;\n`;
    shaclCode += `    sh:targetClass dcat:Dataset ;\n`;

    fields.forEach((fieldWrapper, index) => {
        const fieldType = fieldWrapper.getAttribute('data-type');
        const settingsMenu = fieldWrapper.querySelector('.settings-menu');
        const path = settingsMenu.querySelector('input[name="uri-path"]').value;
        const description = settingsMenu.querySelector('input[name="description"]').value;
        const defaultValue = (fieldType === 'boolean' ? settingsMenu.querySelector('select[name="default-value"]').value : settingsMenu.querySelector('input[name="default-value"]').value);
        const name = fieldWrapper.querySelector('.field-title').innerText;
        let fieldName = name.replace(/\s+/g, '_').toLowerCase(); // Generate a valid property name
        let datatype;

        // Determine the appropriate datatype based on the field type
        switch (fieldType) {
            case 'text':
                const uniqueId = fieldWrapper.getAttribute("unique-id");
                const textType = fieldWrapper.querySelector(`input[name="dash-type-${uniqueId}"]:checked`).value;
                if (textType === "rich-text") datatype = 'rdf:HTML';
                else datatype = 'xsd:string';
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

        // Add the common properties for each field
        shaclCode += `    sh:property [\n`;
        if (path === ``) shaclCode += `        sh:path ${parseUri(fieldName)} ;\n`;
        else shaclCode += `        sh:path ${parseUri(path)} ;\n`;
        shaclCode += `        sh:name "${name}" ;\n`;
        if (description != ``) shaclCode += `        sh:description "${description}" ;\n`;
        if (defaultValue != ``) {
            if (fieldType === 'number') shaclCode += `        sh:defaultValue ${defaultValue} ;\n`;
            else shaclCode += `        sh:defaultValue "${defaultValue}"${(datatype === 'xsd:string') ? '' : '^^' + datatype} ;\n`;
        }
        shaclCode += `        sh:datatype ${datatype} ;\n`;

        // Add additional constraints based on user input
        if (fieldType === 'text') {
            //SHACL
            const minLength = settingsMenu.querySelector('input[name="min-length"]').value;
            const maxLength = settingsMenu.querySelector('input[name="max-length"]').value;
            const pattern = settingsMenu.querySelector('input[name="pattern"]').value;
            if (minLength) shaclCode += `        sh:minLength ${minLength} ;\n`;
            if (maxLength) shaclCode += `        sh:maxLength ${maxLength} ;\n`;
            if (pattern) shaclCode += `        sh:pattern "${pattern}" ;\n`;
            //DASH
            const uniqueId = fieldWrapper.getAttribute("unique-id");
            const textType = settingsMenu.querySelector(`input[name="dash-type-${uniqueId}"]:checked`).value;
            const hasLanguageSelector = settingsMenu.querySelector('input[name="language-selector"]').checked;
            const classUri = settingsMenu.querySelector('input[name="autocomplete-class"]').value;
            let dashEditorType, dashViewerType;
            if (textType === 'standard') dashEditorType = hasLanguageSelector ? "TextFieldWithLangEditor" : "TextFieldEditor", dashViewerType = "LiteralViewer";
            else if (textType === 'multiline') dashEditorType = hasLanguageSelector ? "TextAreaWithLangEditor" : "TextAreaEditor", dashViewerType = "LiteralViewer";
            else if (textType === 'rich-text') dashEditorType = "RichTextEditor", dashViewerType = "HTMLViewer";
            else if (textType === 'blank') dashEditorType = "BlankNodeEditor", dashViewerType = "BlankNodeViewer";   
            else if (textType === 'autocomplete'){
                dashEditorType = "AutoCompleteEditor";
                shaclCode += `        sh:class ${parseUri(classUri)} ;\n`;
                dashViewerType = "LiteralViewer";
            }
            shaclCode += `        dash:editor dash:${dashEditorType} ;\n`;
            shaclCode += `        dash:viewer dash:${dashViewerType} ;\n`;
        }
        if (fieldType === 'number') {
            //SHACL
            const minValue = settingsMenu.querySelector('input[name="min-value"]').value;
            const maxValue = settingsMenu.querySelector('input[name="max-value"]').value;
            if (minValue) shaclCode += `        sh:minInclusive ${minValue} ;\n`;
            if (maxValue) shaclCode += `        sh:maxInclusive ${maxValue} ;\n`;
            //DASH
            shaclCode += `        dash:editor dash:TextFieldEditor ;\n`;
            shaclCode += `        dash:viewer dash:LiteralViewer ;\n`;
        }
        if (fieldType === 'date' || fieldType === 'datetime') {
            //SHACL
            const minDate = settingsMenu.querySelector('input[name="min-date"], input[name="min-datetime"]').value;
            const maxDate = settingsMenu.querySelector('input[name="max-date"], input[name="max-datetime"]').value;
            if (minDate) shaclCode += `        sh:minInclusive "${minDate}"^^xsd:${fieldType === 'date' ? 'date' : 'dateTime'} ;\n`;
            if (maxDate) shaclCode += `        sh:maxInclusive "${maxDate}"^^xsd:${fieldType === 'date' ? 'date' : 'dateTime'} ;\n`;
            //DASH
            shaclCode += `        dash:editor dash:${fieldType === 'date' ? 'DatePickerEditor' : 'DateTimePickerEditor'} ;\n`;
            shaclCode += `        dash:viewer dash:LiteralViewer ;\n`;
        }
        if (fieldType === 'boolean') {
            //SHACL
            //DASH
            shaclCode += `        dash:editor dash:BooleanSelectEditor ;\n`;
            shaclCode += `        dash:viewer dash:LiteralViewer ;\n`;
        }
        if (fieldType === 'uri') {
            //SHACL
            const uriPattern = settingsMenu.querySelector('input[name="uri-pattern"]').value;
            if (uriPattern) shaclCode += `        sh:pattern "${parseUri(uriPattern)}" ;\n`;
            const subclassOfUri = settingsMenu.querySelector('input[name="subclass-of-uri"]').value;
            if (subclassOfUri) shaclCode += `        dash:rootClass "${parseUri(uriPattern)}" ;\n`;
            //DASH
            shaclCode += `        dash:editor dash:${subclassOfUri ? 'SubClassEditor' : 'URIEditor'} ;\n`;
            shaclCode += `        dash:viewer dash:URIViewer ;\n`;
        }
        if (fieldType === 'select') {
            const uniqueId = fieldWrapper.getAttribute("unique-id");
            const selectType = settingsMenu.querySelector(`input[name="dash-type-${uniqueId}"]:checked`).value;
            if (selectType === 'list'){
                const options = settingsMenu.querySelector('input[name="options"]').value.split(',').map(opt => opt.trim());
                if (options.length > 0) {
                    shaclCode += `        sh:in ( ${options.map(opt => `"${opt}"`).join(' ')} ) ;\n`;
                }
                shaclCode += `        dash:editor dash:EnumSelectEditor ;\n`;
            }
            else if (selectType === 'instance-of'){
                const instanceOfClass = settingsMenu.querySelector('input[name="instance-of-uri"]').value
                shaclCode += `        sh:class ${parseUri(instanceOfClass)} ;\n`;
                shaclCode += `        dash:editor dash:InstancesSelectEditor ;\n`;
            }            
            shaclCode += `        dash:viewer dash:LiteralViewer ;\n`;
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

        // Handle groups
        let fieldParentElement = fieldWrapper.parentElement.parentElement;
        if (fieldParentElement.className === "group-wrapper"){
            groupUri = fieldParentElement.querySelector('input[name="group-uri"]').value;
            shaclCode += `        sh:group ${parseUri(groupUri)} ;\n`;
        }

        // Add sh:order at the end
        shaclCode += `        sh:order ${index} ;\n`;

        shaclCode += `    ] ;\n`;
    });

    // Remove trailing semicolon from the last property and add a period to end the shape definition
    shaclCode = shaclCode.trim().replace(/;$/, '.') + '\n';
    
    const groups = document.querySelectorAll('#form-editor .group-wrapper');
    if (groups.length) groups.forEach((groupWrapper, index) => {
        const inputsMenu = groupWrapper.querySelector('.input-wrapper');
        const groupUri = inputsMenu.querySelector('input[name="group-uri"]').value;
        const groupLabel = inputsMenu.querySelector('input[name="group-label"]').value;
        shaclCode += `\n${parseUri(groupUri)}\n`;
        shaclCode += `    a sh:PropertyGroup ;\n`;
        shaclCode += `    sh:order ${index} ;\n`;
        shaclCode += `    rdfs:label "${groupLabel}" .\n`;
    });

    document.getElementById('shacl-output').textContent = shaclCode;
});
