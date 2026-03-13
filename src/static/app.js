document.addEventListener("DOMContentLoaded", () => {
  const capabilitiesList = document.getElementById("capabilities-list");
  const consultantsList = document.getElementById("consultants-list");
  const capabilitySelect = document.getElementById("capability");
  const registerForm = document.getElementById("register-form");
  const messageDiv = document.getElementById("message");

  function parseCommaSeparated(value) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function renderConsultantBadges(values, emptyState) {
    if (!values || values.length === 0) {
      return `<span class="empty-state">${emptyState}</span>`;
    }

    return values
      .map((value) => `<span class="tag">${value}</span>`)
      .join("");
  }

  // Function to fetch capabilities from API
  async function fetchCapabilities() {
    try {
      const response = await fetch("/capabilities");
      const capabilities = await response.json();

      // Clear loading message
      capabilitiesList.innerHTML = "";
      capabilitySelect.innerHTML = '<option value="">-- Select a capability --</option>';

      // Populate capabilities list
      Object.entries(capabilities).forEach(([name, details]) => {
        const capabilityCard = document.createElement("div");
        capabilityCard.className = "capability-card";

        const availableCapacity = details.capacity || 0;
        const currentConsultants = details.consultant_count || 0;

        // Create consultants HTML with delete icons
        const consultantsHTML =
          details.consultants && details.consultants.length > 0
            ? `<div class="consultants-section">
              <h5>Registered Consultants:</h5>
              <ul class="consultants-list">
                ${details.consultants
                  .map(
                    (consultant) =>
                      `<li>
                        <div>
                          <span class="consultant-email">${consultant.name}</span>
                          <div class="consultant-meta">${consultant.email} • ${consultant.skill_level || "Unrated"} • ${consultant.availability ?? "?"} hrs/week</div>
                        </div>
                        <button class="delete-btn" data-capability="${name}" data-email="${consultant.email}">Remove</button>
                      </li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No consultants registered yet</em></p>`;

        capabilityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Practice Area:</strong> ${details.practice_area}</p>
          <p><strong>Industry Verticals:</strong> ${details.industry_verticals ? details.industry_verticals.join(', ') : 'Not specified'}</p>
          <p><strong>Capacity:</strong> ${availableCapacity} hours/week available</p>
          <p><strong>Current Team:</strong> ${currentConsultants} consultants</p>
          <p><strong>Required Certifications:</strong> ${details.certifications ? details.certifications.join(', ') : 'None listed'}</p>
          <div class="consultants-container">
            ${consultantsHTML}
          </div>
        `;

        capabilitiesList.appendChild(capabilityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        capabilitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      capabilitiesList.innerHTML =
        "<p>Failed to load capabilities. Please try again later.</p>";
      console.error("Error fetching capabilities:", error);
    }
  }

  async function fetchConsultants() {
    try {
      const response = await fetch("/consultants");
      const consultants = await response.json();

      if (!consultants.length) {
        consultantsList.innerHTML = "<p>No consultant profiles found yet.</p>";
        return;
      }

      consultantsList.innerHTML = consultants
        .map(
          (consultant) => `
            <article class="consultant-card">
              <div class="consultant-card-header">
                <div>
                  <h4>${consultant.name}</h4>
                  <p>${consultant.email}</p>
                </div>
                <span class="skill-pill">${consultant.skill_level || "Unrated"}</span>
              </div>
              <p><strong>Practice Area:</strong> ${consultant.practice_area || "Not set"}</p>
              <p><strong>Availability:</strong> ${consultant.availability ?? "Not set"} hours/week</p>
              <div>
                <strong>Certifications:</strong>
                <div class="tag-group">${renderConsultantBadges(consultant.certifications, "No certifications")}</div>
              </div>
              <div>
                <strong>Preferred Industries:</strong>
                <div class="tag-group">${renderConsultantBadges(consultant.preferred_industries, "No industry preferences")}</div>
              </div>
              <div>
                <strong>Registered Capabilities:</strong>
                <div class="tag-group">${renderConsultantBadges(consultant.registered_capabilities, "No capabilities registered")}</div>
              </div>
            </article>
          `
        )
        .join("");
    } catch (error) {
      consultantsList.innerHTML =
        "<p>Failed to load consultant profiles. Please try again later.</p>";
      console.error("Error fetching consultants:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const capability = button.getAttribute("data-capability");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(
          capability
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh capabilities list to show updated consultants
        fetchCapabilities();
        fetchConsultants();
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
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const capability = document.getElementById("capability").value;
    const name = document.getElementById("name").value.trim();
    const practiceArea = document.getElementById("practice-area").value;
    const skillLevel = document.getElementById("skill-level").value;
    const availabilityValue = document.getElementById("availability").value;
    const certifications = parseCommaSeparated(
      document.getElementById("certifications").value
    );
    const preferredIndustries = parseCommaSeparated(
      document.getElementById("preferred-industries").value
    );

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(capability)}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            name,
            practice_area: practiceArea,
            skill_level: skillLevel,
            availability: availabilityValue ? Number(availabilityValue) : null,
            certifications,
            preferred_industries: preferredIndustries,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        registerForm.reset();

        // Refresh capabilities list to show updated consultants
        fetchCapabilities();
        fetchConsultants();
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
      messageDiv.textContent = "Failed to register. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error registering:", error);
    }
  });

  // Initialize app
  fetchCapabilities();
  fetchConsultants();
});
