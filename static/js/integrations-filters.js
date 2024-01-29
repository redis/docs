// Get references to the group filter, name filter, command filter, and grid items
const groupFilter = document.getElementById('group-filter');
const nameFilter = document.getElementById('name-filter');
const gridItems = document.querySelectorAll('#commands-grid article');

// Function to filter grid items
function filterGridItems() {
    const selectedGroup = groupFilter.value; // Get the selected group from the group filter
    const nameQuery = nameFilter.value.trim().toLowerCase(); // Get the search query from the name filter

    // Loop through each grid item
    gridItems.forEach(item => {
        const itemName = item.dataset.name.toLowerCase(); // Get the value of data-name attribute
        const itemGroup = item.dataset.group; // Get the value of data-group attribute
      
        // Check if the item matches the selected group (or if no group is selected), the name query, and the command query
        const matchesGroup = selectedGroup === '' || selectedGroup === itemGroup;
        const matchesName = itemName.includes(nameQuery);

        console.log(selectedGroup)
      
        // Show the item if it matches the selected group (or no group selected), the name query, and the command query, otherwise hide it
        item.style.display = matchesGroup && matchesName ? 'flex' : 'none';
    });
}

// Listen for change events on the group filter
groupFilter.addEventListener('change', filterGridItems);

// Listen for input events on the name filter
nameFilter.addEventListener('input', filterGridItems);


// Initially filter grid items based on the initial state of the group filter, name filter, and command filter
filterGridItems();
