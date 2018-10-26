
//Script to show the modal when you click on the sign in button
$('#signIn').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget) // Button that triggered the modal
  var recipient = button.data('whatever')
  var modal = $(this)
  modal.find('.modal-title').text('Sign In again')
  modal.find('.modal-body input').val(recipient)
})

//Script to show the modal when you click on the sign up button
$('#signUp').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget) // Button that triggered the modal
  var recipient = button.data('whatever')
  var modal = $(this)
  modal.find('.modal-title').text('Sign Up for the first time')
  modal.find('.modal-body input').val(recipient)
})

//Simple jquery UI function to let user move bikes around
$(function() {
    $( "#bikes" ).sortable();
    $( "#bikes" ).disableSelection();
});
