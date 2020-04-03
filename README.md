# Reusable email input
This library implements reusable multi-email input. It contains no external dependencies and supports modern browsers and IE11.

# Usage example
## Basic 
Most basic example looks like this — email input is instancied inside of a custom div element:

```html

  <form class="interactive-input-preview">
    <div id="custom-input">
    </div>
  </form>

  <script>
    window.addEventListener("DOMContentLoaded", function () {
      new EmailsInput(document.querySelector("#custom-input"));
    });
  </script>

```
## Example with pre-filled data, custom markup and API usage.
The component is designed to work in server-side rendered markup. 

This example shows several features — custom header and pre-filled values.

```html

      <div id="emails-input">
        <h2>Share <strong>Board name</strong> with others</h2>
        
        <!-- these values will be picked up when component will be initialized -->
        <input type="text" name="email" value="john@miro.com" />
        <input type="text" name="email" value="invalid.email" />
        <input type="text" name="email" value="mike@miro.com" />
        <input type="text" name="email" value="alexander@miro.com" />
      </div>

    <script>
      window.addEventListener("DOMContentLoaded", function () {
        var emailsInput = new EmailsInput(document.querySelector("#emails-input"), {});

        document.getElementById("add-email").addEventListener("click", e => {
          e.preventDefault();
          emailsInput.addItem(randomEmail());
        });

        document
          .getElementById("get-emails-count")
          .addEventListener("click", e => {
            e.preventDefault();

            window.alert(emailsInput.getCount());
          });

        emailsInput.subscribe(list => {
          console.log("Emails in the list", list);
        });
      });</script>

```

Same way as values go in, they go out — newly entered emails are 
appended to the form. This way, when the form is submitted, no additional scripting is required.

# API methods

Once created, an instance of the EmailInput supports several api method.

`addItem(newEmail: string): Promise` — Add new email to the list.

`deleteItem(existingEmail:string): Promise` — Delete existing email from the list.

Note that these two methods return promises — those promises will be rejected if adding or removing will fail for internal reason.

`getAll()` — Get all emails.

`replaceAll(newEmails: string[])` — Replace emails with new values. This is also a convinient way to reset the input.

`subscribe(subscriber: function)` — Subscribe to the changes in the input.

# Next steps
