const input = document.getElementById('productImage');
const hidden = document.getElementById('imageBase64');

input.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        hidden.value = e.target.result; // Store the base64 string in the hidden input
    }
    reader.readAsDataURL(file);
});