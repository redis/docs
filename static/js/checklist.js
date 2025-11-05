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
        
        const options = [
            { value: 'R', label: '&#x274C;' },
            { value: 'G', label: '&#9989;' },
            { value: 'A', label: '&#x1F50D;' },
            { value: 'X', label: '&#x2205;' }
        ];
        
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.innerHTML = opt.label;
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
    countersDiv.innerHTML = `
        <label for="${formId}-gcount">&#9989; = </label>
        <output name="gcount" id="${formId}-gcount">0</output>/<output id="${formId}-gtotal">0</output>,
        <label for="${formId}-rcount">&#x274C; = </label>
        <output name="rcount" id="${formId}-rcount">0</output>/<output id="${formId}-rtotal">0</output>,
        <label for="${formId}-acount">&#x1F50D; = </label>
        <output name="acount" id="${formId}-acount">0</output>/<output id="${formId}-atotal">0</output>
        <br/>
        (<label for="${formId}-xcount">&#x2205; = </label>
        <output name="xcount" id="${formId}-xcount">0</output>)
    `;
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

