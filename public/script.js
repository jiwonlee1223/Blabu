window.onload = function() {
    const textareas = [
        { id: 'textInput4', file: 'public/txt/Manual.txt' },
        { id: 'textInput5', file: 'public/txt/Domain.txt' },
        { id: 'textInput6', file: 'public/txt/Start_Internal.txt' },
        { id: 'textInput7', file: 'text3.txt' },
        { id: 'textInput8', file: 'public/txt/Start_external.txt' },
        { id: 'textInput9', file: 'text3.txt' }
    ];

    textareas.forEach(item => {
        const textarea = document.getElementById(item.id);

        fetch(item.file)
            .then(response => response.text())
            .then(data => {
                textarea.value = data;
            })
            .catch(error => console.error(`Error fetching the text from ${item.file}:`, error));
    });
};
