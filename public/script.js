const inpFile = document.getElementById('inpFile');
const previewImage = document.querySelector('#hidden-input');
	
inpFile.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.addEventListener('load', function() {
            console.log(this);
            $(previewImage).val(this.result)
        });
        reader.readAsDataURL(file);
    };
});