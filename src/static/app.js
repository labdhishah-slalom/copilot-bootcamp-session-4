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
    // Helper to safely render badge-like tags into a container element
    function appendBadges(container, values, fallbackText) {
      let items = [];

      if (Array.isArray(values)) {
        items = values;
      } else if (typeof values === "string" && values.trim() !== "") {
        items = parseCommaSeparated(values);
      }

      if (!items.length) {
        const fallbackSpan = document.createElement("span");
        fallbackSpan.textContent = fallbackText;
        container.appendChild(fallbackSpan);
        return;
      }

      items.forEach((item) => {
        const badge = document.createElement("span");
        badge.textContent = item;
        container.appendChild(badge);
      });
    }

    try {
      const response = await fetch("/consultants");
      const consultants = await response.json();

      // Clear any existing content
      consultantsList.textContent = "";

      if (!consultants.length) {
        const p = document.createElement("p");
        p.textContent = "No consultant profiles found yet.";
        consultantsList.appendChild(p);
        return;
      }

      consultants.forEach((consultant) => {
        const article = document.createElement("article");
        article.className = "consultant-card";

        const header = document.createElement("div");
        header.className = "consultant-card-header";

        const headerInfo = document.createElement("div");

        const nameEl = document.createElement("h4");
        nameEl.textContent = consultant.name || "";

        const emailEl = document.createElement("p");
        emailEl.textContent = consultant.email || "";

        headerInfo.appendChild(nameEl);
        headerInfo.appendChild(emailEl);

        const skillPill = document.createElement("span");
        skillPill.className = "skill-pill";
        skillPill.textContent = consultant.skill_level || "Unrated";

        header.appendChild(headerInfo);
        header.appendChild(skillPill);

        const practicePara = document.createElement("p");
        const practiceStrong = document.createElement("strong");
        practiceStrong.textContent = "Practice Area:";
        practicePara.appendChild(practiceStrong);
        practicePara.appendChild(document.createTextNode(" " + (consultant.practice_area || "Not set")));

        const availabilityPara = document.createElement("p");
        const availabilityStrong = document.createElement("strong");
        availabilityStrong.textContent = "Availability:";
        availabilityPara.appendChild(availabilityStrong);
        const availabilityText = consultant.availability ?? "Not set";
        availabilityPara.appendChild(document.createTextNode(" " + availabilityText + " hours/week"));

        const certificationsDiv = document.createElement("div");
        const certificationsStrong = document.createElement("strong");
        certificationsStrong.textContent = "Certifications:";
        const certificationsTagGroup = document.createElement("div");
        certificationsTagGroup.className = "tag-group";
        appendBadges(certificationsTagGroup, consultant.certifications, "No certifications");
        certificationsDiv.appendChild(certificationsStrong);
        certificationsDiv.appendChild(certificationsTagGroup);

        const industriesDiv = document.createElement("div");
        const industriesStrong = document.createElement("strong");
        industriesStrong.textContent = "Preferred Industries:";
        const industriesTagGroup = document.createElement("div");
        industriesTagGroup.className = "tag-group";
        appendBadges(industriesTagGroup, consultant.preferred_industries, "No industry preferences");
        industriesDiv.appendChild(industriesStrong);
        industriesDiv.appendChild(industriesTagGroup);

        const capabilitiesDiv = document.createElement("div");
        const capabilitiesStrong = document.createElement("strong");
        capabilitiesStrong.textContent = "Registered Capabilities:";
        const capabilitiesTagGroup = document.createElement("div");
        capabilitiesTagGroup.className = "tag-group";
        appendBadges(capabilitiesTagGroup, consultant.registered_capabilities, "No capabilities registered");
        capabilitiesDiv.appendChild(capabilitiesStrong);
        capabilitiesDiv.appendChild(capabilitiesTagGroup);

        article.appendChild(header);
        article.appendChild(practicePara);
        article.appendChild(availabilityPara);
        article.appendChild(certificationsDiv);
        article.appendChild(industriesDiv);
        article.appendChild(capabilitiesDiv);

        consultantsList.appendChild(article);
      });
    } catch (error) {
      consultantsList.textContent = "";
      const p = document.createElement("p");
      p.textContent = "Failed to load consultant profiles. Please try again later.";
      consultantsList.appendChild(p);
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
