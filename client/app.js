function handleSubmit(event) {
    event.preventDefault();
    //if valid go to index
    window.location.href = 'index.html';
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submitButton');
    if (submitButton) {
        submitButton.addEventListener('click', (event)=>{
            handleSubmit(event);
        });
    }

    const showAll = document.getElementById('showAll');
    if (showAll) {
        showAll.addEventListener('click', (event)=>{
            handleShowAll(event);
        });
    }

    const deleteButton = document.getElementById('delete');
    if(deleteButton){
        deleteButton.addEventListener('click', () =>{
            console.log("click");
            const SIN = document.getElementById('SIN').value.trim();

            if(SIN){
                fetch(`${window.location.origin}/search_family`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({SIN})
                })
                .then(response => {
                    if (!response.ok) { 
                        throw new Error('failed');
                    }
                    return response.json();
                })
                .then(data => {
                    alert("You deleted the data!");
                })
                .catch(error => {
                    console.error('There was a problem with server:', error);
                });
            } else {
                alert('Not valid SIN');
            }
        })
    }


});

function handleSubmit(event) {
    event.preventDefault(); //prevent the default setting

    const form = document.getElementById('addPersonForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    let emptyFields = [];
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            emptyFields.push(field.name || field.id);
        }
    });

    if (!isValid) {
        alert(`Fill out all required fields: ${emptyFields.join(', ')}`);
        return;
    }

    const formData = new FormData(form); //extract form data

    const jsonData = {};
    formData.forEach((value, key) => {
        jsonData[key] = value;
    });

    console.log(jsonData);

    //send data to the server as JSON
    fetch(`${window.location.origin}/add_person`, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(jsonData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('response not ok');
        }
        return response.json();
    })
    .then(data => {
        //alert user that data was successfully submitted
        alert("Your data successfully submitted to the database");
        //redirect user to index page
        window.location.href = 'index.html';
    })
    .catch(error => {
        console.error('There was a problem with server:', error);
    });

}

function handleShowAll(event) {
    event.preventDefault();
    
    fetch(`${window.location.origin}/get_all_personal_info`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {

            sessionStorage.setItem('allPersonalInfo', JSON.stringify(data));
            window.location.href = 'result.html';
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Error fetching data. Please try again.');
        });
}
