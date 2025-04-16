document.getElementById("loginButton").addEventListener("click", async function(event) {
    event.preventDefault(); // Prevent default form submission

    const username = document.getElementById("userID").value; // Changed to username
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("https://law-enforcement.onrender.com/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password }) // Send username instead of userID
        });

        const data = await response.json();

        if (data.success) {
            alert("Login successful! Redirecting...");
            // Check if the username is 'admin'
            if (username === 'admin') {
                window.location.href = "admin.html";  // Redirect to admin page
            } else {
                window.location.href = "dashboardv6.html";  // Redirect to dashboard
            }
        } else {
            alert("Invalid username or password, or account is inactive!");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while logging in.");
    }
});