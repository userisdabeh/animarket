const editUserModal = document.getElementById('editUserModal');
if (editUserModal) {
    editUserModal.addEventListener('show.bs.modal', event => {
        const button = event.relatedTarget;

        const userId = button.getAttribute('data-bs-userId');
        const username = button.getAttribute('data-bs-username');
        const email = button.getAttribute('data-bs-email');
        const role = button.getAttribute('data-bs-role');
        const accountStatus = button.getAttribute('data-bs-account-status');

        const modalUserIdInput = editUserModal.querySelector('#editUserId');
        const modalUsernameInput = editUserModal.querySelector('#editUserName');
        const modalEmailInput = editUserModal.querySelector('#editUserEmail');
        const modalRoleSelect = editUserModal.querySelector('#editUserRole');
        const modalAccountStatusSelect = editUserModal.querySelector('#editUserStatus');

        modalUserIdInput.value = userId;
        modalUsernameInput.value = username;
        modalEmailInput.value = email;
        modalRoleSelect.value = role;
        modalAccountStatusSelect.value = accountStatus;
    });
}