document.addEventListener('DOMContentLoaded', () => {
    // Find all checklist code blocks
    const checklists = document.querySelectorAll('pre.checklist-source');
    console.log('Found', checklists.length, 'checklist(s)');

    checklists.forEach(pre => {
        const checklistId = pre.getAttribute('data-checklist-id');
        const markdownContent = pre.textContent;
        console.log('Processing checklist:', checklistId);

        // Parse markdown and create interactive checklist
        createChecklistFromMarkdown(markdownContent, checklistId, pre);
    });
});

function createChecklistFromMarkdown(markdown, formId, preElement) {
    const lines = markdown.split('\n');
    const items = [];
    
    // Parse checklist items from markdown
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.match(/^- \[[\sx]\]/)) {
            items.push(trimmed);
        }
    });
    
    if (items.length === 0) return;
    
    // Create form
    const form = document.createElement('form');
    form.id = formId;
    
    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none';
    ul.style.paddingLeft = '0px';
    
    // Parse each item
    items.forEach(item => {
        const li = document.createElement('li');
        
        // Create select dropdown
        const select = document.createElement('select');
        select.onchange = () => clChange(formId);

        // Add styling to make the select element look like an interactive control
        select.style.border = '1px solid #d0d0d0';
        select.style.borderRadius = '4px';
        select.style.padding = '4px 6px';
        select.style.backgroundColor = '#fafafa';
        select.style.cursor = 'pointer';
        select.style.fontFamily = 'inherit';
        select.style.fontSize = 'inherit';
        select.style.marginRight = '8px';
        select.style.transition = 'all 0.2s ease';

        // Add hover effects
        select.addEventListener('mouseenter', () => {
            select.style.borderColor = '#999';
            select.style.backgroundColor = '#f0f0f0';
            select.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        });

        select.addEventListener('mouseleave', () => {
            select.style.borderColor = '#d0d0d0';
            select.style.backgroundColor = '#fafafa';
            select.style.boxShadow = 'none';
        });

        const options = [
            { value: 'R', label: '❌' },
            { value: 'G', label: '✅' },
            { value: 'A', label: '🔍' },
            { value: 'X', label: '∅' }
        ];

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            select.appendChild(option);
        });

        li.appendChild(select);
        
        // Parse link and text from markdown
        // Format: - [ ] [text](#anchor) or - [ ] text
        const linkMatch = item.match(/\[([^\]]+)\]\(([^\)]+)\)/);
        if (linkMatch) {
            const a = document.createElement('a');
            a.href = linkMatch[2];
            a.textContent = linkMatch[1];
            li.appendChild(a);
        } else {
            // Just text after the checkbox
            const text = item.replace(/^- \[[\sx]\]\s*/, '');
            li.appendChild(document.createTextNode(text));
        }
        
        ul.appendChild(li);
    });
    
    form.appendChild(ul);
    
    // Add counters
    const countersDiv = document.createElement('div');

    // Create counter elements safely without innerHTML
    const createCounterLabel = (emoji, countId, totalId, isDisabled = false) => {
        const label = document.createElement('label');
        label.htmlFor = countId;
        label.textContent = emoji + ' = ';

        const countOutput = document.createElement('output');
        countOutput.name = countId.replace(formId + '-', '');
        countOutput.id = countId;
        countOutput.textContent = '0';

        const fragment = document.createDocumentFragment();
        fragment.appendChild(label);
        fragment.appendChild(countOutput);

        if (!isDisabled) {
            fragment.appendChild(document.createTextNode('/'));
            const totalOutput = document.createElement('output');
            totalOutput.id = totalId;
            totalOutput.textContent = '0';
            fragment.appendChild(totalOutput);
            fragment.appendChild(document.createTextNode(', '));
        } else {
            fragment.appendChild(document.createTextNode(')'));
        }

        return fragment;
    };

    countersDiv.appendChild(createCounterLabel('✅', formId + '-gcount', formId + '-gtotal'));
    countersDiv.appendChild(createCounterLabel('❌', formId + '-rcount', formId + '-rtotal'));
    countersDiv.appendChild(createCounterLabel('🔍', formId + '-acount', formId + '-atotal'));

    const brElement = document.createElement('br');
    countersDiv.appendChild(brElement);

    const openParen = document.createTextNode('(');
    countersDiv.appendChild(openParen);
    countersDiv.appendChild(createCounterLabel('∅', formId + '-xcount', '', true));

    form.appendChild(countersDiv);
    
    // Replace the entire <pre> element with the interactive form
    preElement.replaceWith(form);
    
    // Initialize
    let itemString = localStorage.getItem(formId);
    if (itemString) {
        setCLItemsFromString(formId, itemString);
    } else {
        clChange(formId);
    }
}

function getStringFromCLItems(formId) {
    let result = "";
    let form = document.getElementById(formId);
    let listItems = form.getElementsByTagName("li");

    for (let elem of listItems) {
        let menu = elem.getElementsByTagName("select")[0];
        result += menu.value;
    }

    return result;
}

function setCLItemsFromString(formId, clString) {
    let counts = {R: 0, G: 0, A: 0, X:0};

    let form = document.getElementById(formId);
    let listItems = form.getElementsByTagName("li");

    if (clString.length < listItems.length) {
        clString = clString.padEnd(listItems.length, "R");
    } else if (clString.length > listItems.length) {
        clString = clString.substring(0, listItems.length);
    }

    for (let i = 0; i < clString.length; i++) {
        let char = clString.charAt(i);
        counts[char]++;
        let menu = listItems[i].getElementsByTagName("select")[0];
        menu.value = char;
    }

    form.elements["gcount"].value = counts["G"];
    form.elements["rcount"].value = counts["R"];
    form.elements["acount"].value = counts["A"];
    form.elements["xcount"].value = counts["X"];

    let numClItems = listItems.length - counts["X"];

    document.getElementById(formId + "-rtotal").textContent = numClItems;
    document.getElementById(formId + "-gtotal").textContent = numClItems;
    document.getElementById(formId + "-atotal").textContent = numClItems;

    let itemChoices = getStringFromCLItems(formId);
    localStorage.setItem(formId, itemChoices);
}

function clChange(formId) {
    let itemChoices = getStringFromCLItems(formId);
    setCLItemsFromString(formId, itemChoices);
}

