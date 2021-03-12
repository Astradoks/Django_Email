document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");

  // Send email
  document.querySelector("#compose-form").onsubmit = function () {
    fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        recipients: document.querySelector("#compose-recipients").value,
        subject: document.querySelector("#compose-subject").value,
        body: document.querySelector("#compose-body").value,
      }),
    })
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      load_mailbox("sent");
      });
  };
});

// Const to make something sleep for a little time
const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

//################################################
// Function to show the compose elements in index
//################################################

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

//################################################
// Function to show the mailbox elements in index
//################################################

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  // Show all mails
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((email) => {
        let element = document.createElement("div");
        if (email.read) {
          element.className = "card card-body bg-secondary text-white";
        } else {
          element.className = "card card-body";
        }
        element.addEventListener("click", () => load_email(email.id));
        element.innerHTML = `<div class="row"><div class="col-md-3 font-weight-bold">${email.sender}</div><div class="col-md-6">${email.subject}</div><div class="col-md-3 font-weight-light">${email.timestamp}</div></div>`;
        document.querySelector("#emails-view").append(element);
      });
    });
}

//################################################
// Function to show the email elements in index
//################################################

function load_email(email_id) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  // See all mail information
  sent_flag = false;
  fetch(`/emails/${email_id}`)
    .then((response) => response.json())
    .then((email) => {
      document.querySelector("#email_from").innerHTML = email.sender;
      document.querySelector("#email_to").innerHTML = email.recipients;
      document.querySelector("#email_subject").innerHTML = email.subject;
      document.querySelector("#email_timestamp").innerHTML = email.timestamp;
      document.querySelector("#email_body").innerHTML = email.body;
      document.querySelector("#reply").addEventListener("click", () => {
        compose_email();
        document.querySelector("#compose-recipients").value = email.sender;
        document.querySelector("#compose-subject").value = (email.subject.substring(0, 3) === 'Re:') ? email.subject : 'Re: ' + email.subject;
        document.querySelector("#compose-body").value = 'On ' + email.timestamp + ' ' + email.sender + ' wrote: \n' + email.body;
      });
      // Mark as archived
      fetch('emails/sent')
      .then((response) => response.json())
      .then((emails) => {
        emails.forEach(email => {
          if (email.id === email_id) {
            sent_flag = true;
          }
        })
        if (sent_flag){
          document.querySelector("#archive").style.display = "none";
        } else {
          document.querySelector("#archive").style.display = "block";
          if (email.archived) {
            document.querySelector("#archive").innerHTML = "Unarchive";
          } else {
            document.querySelector("#archive").innerHTML = "Archive";
          }
          document.querySelector("#archive").onclick = function () {
            archive_email(email.id);
          }
        }
      });
    });

  // Mark as read
  fetch(`/emails/${email_id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  });
}

//################################################
// Function to archive email
//################################################

function archive_email(email_id) {
  // Get mail to check if it is archved
  fetch(`/emails/${email_id}`)
    .then((response) => response.json())
    .then((email) => {
      // Change the value of archived in email
      if (email.archived) {
        fetch(`/emails/${email_id}`, {
          method: "PUT",
          body: JSON.stringify({
            archived: false,
          }),
        })
        .then(sleep(100).then(() => {
          load_mailbox('inbox');
        }));
      } else {
        fetch(`/emails/${email_id}`, {
          method: "PUT",
          body: JSON.stringify({
            archived: true,
          }),
        })
        .then(sleep(100).then(() => {
          load_mailbox('inbox');
        }));
      }
    });
}
