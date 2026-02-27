document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const hasParticipants = details.participants && details.participants.length > 0;

        // build participants list markup if there are any
        let participantsMarkup = "";
        if (hasParticipants) {
          const items = details.participants
            .map(
              (email) => `
                <li>
                  <span class="participant-email">${email}</span>
                  <span class="delete-participant" data-activity="${name}" data-email="${email}">&times;</span>
                </li>`
            )
            .join("");
          participantsMarkup = `
            <p><strong>Participants:</strong></p>
            <ul class="participants-list">
              ${items}
            </ul>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsMarkup}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities to show new participant and updated availability
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate clicks for delete icons inside activities list
  activitiesList.addEventListener("click", async (event) => {
    const target = event.target;
    if (target.classList.contains("delete-participant")) {
      const activity = target.dataset.activity;
      const email = target.dataset.email;

      if (!activity || !email) return;

      try {
        const res = await fetch(
          `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
        const result = await res.json();
        if (res.ok) {
          // remove the list item and refresh availability
          const li = target.closest("li");
          if (li) li.remove();
          // optionally show a brief message
          messageDiv.textContent = result.message;
          messageDiv.className = "success";
          messageDiv.classList.remove("hidden");
          setTimeout(() => {
            messageDiv.classList.add("hidden");
            // refresh activities to update counts
            fetchActivities();
          }, 3000);
        } else {
          messageDiv.textContent = result.detail || "Could not remove participant";
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
        }
      } catch (err) {
        messageDiv.textContent = "Error removing participant";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        console.error("Error deleting participant:", err);
      }
    }
  });

  // Initialize app
  fetchActivities();
});
