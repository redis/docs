// Get references to the group filter, name filter, command filter, and grid items
const groupFilter = document.getElementById('group-filter');
const nameFilter = document.getElementById('name-filter');
const gridItems = document.querySelectorAll('#commands-grid article');
const alphaFilterButtons = document.querySelectorAll('#alpha-filter-container button');

// Function to filter grid items
function filterGridItems() {
    const selectedGroup = groupFilter.value; // Get the selected group from the group filter
    const nameQuery = nameFilter.value.trim().toLowerCase(); // Get the search query from the name filter

    let selectedAlpha; // Variable to store the selected first letter from the alpha filter

    // Loop through alpha filter buttons to find the selected first letter
    alphaFilterButtons.forEach(button => {
        if (button.classList.contains('active')) {
            selectedAlpha = button.value; // Get the value of the active button
            return;
        }
    });


    // Loop through each grid item
    gridItems.forEach(item => {
        const itemName = item.dataset.name.toLowerCase(); // Get the value of data-name attribute
        const itemSummary = (item.dataset.summary || '').toLowerCase(); // Get the value of data-summary attribute
        const itemGroup = item.dataset.group; // Get the value of data-group attribute
        const firstLetter = itemName.charAt(0); // Get the first letter of the item name

        // Check if the item matches the selected group (or if no group is selected), the name query, and the command query
        const matchesGroup = selectedGroup === '' || selectedGroup === itemGroup;
        const matchesName = itemName.includes(nameQuery) || itemSummary.includes(nameQuery);
        const matchesAlpha = !selectedAlpha || firstLetter === selectedAlpha;

        console.log(selectedGroup)

        // Show the item if it matches the selected group (or no group selected), the name query, and the command query, otherwise hide it
        item.style.display = matchesGroup && matchesName && matchesAlpha ? 'flex' : 'none';
    });
}

// Function to handle click events on alpha filter buttons
function handleAlphaFilterClick(event) {
    // Remove 'active' class from all buttons
    alphaFilterButtons.forEach(button => {
        button.classList.remove('active');
    });

    const clickedButton = event.currentTarget;
    clickedButton.classList.add('active'); // Add 'active' class to the clicked button

    filterGridItems(); // Apply filter based on the selected first letter
}

// Function to handle key down events
function keyDownHandler(event) {
    switch (event.key) {
        case "Enter":
            visibleLibrariesAndTools = document.querySelectorAll("article.flex.flex-col.gap-2.transition.relative:not([style='display: none;'])")
            if (visibleLibrariesAndTools.length == 1) {
                event.preventDefault();
                libraryAndToolHref = visibleLibrariesAndTools[0].getElementsByTagName("a")[0].href
                window.location.assign(libraryAndToolHref)
            };
        default:
            return;
    }
};

// Listen for change events on the group filter
groupFilter.addEventListener('change', filterGridItems);

// Listen for input events on the name filter
nameFilter.addEventListener('input', filterGridItems);
nameFilter.addEventListener('keydown', keyDownHandler);

// Attach click event listeners to alpha filter buttons
alphaFilterButtons.forEach(button => {
    button.addEventListener('click', handleAlphaFilterClick);
});


// Initially filter grid items based on the initial state of the group filter, name filter, and command filter
filterGridItems();
