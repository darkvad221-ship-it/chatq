function addTask() {
    let task = document.getElementById("task").value;

    if (task == "") return;

    let li = document.createElement("li");

    li.innerHTML =
        task +
        ' <button onclick="editTask(this)">Edit</button>' +
        ' <button onclick="deleteTask(this)">Delete</button>';

    document.getElementById("list").appendChild(li);

    document.getElementById("task").value = "";
}

function deleteTask(btn) {
    btn.parentElement.remove();
}

function editTask(btn) {
    let newTask = prompt(
        "Edit task:",
        btn.parentElement.firstChild.textContent
    );

    if (newTask) {
        btn.parentElement.firstChild.textContent = newTask + " ";
    }
}
