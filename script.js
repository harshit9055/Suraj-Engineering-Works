document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        document.getElementById('register-message').textContent = data.message;
    } catch (error) {
        console.error('Registration error:', error);
        document.getElementById('register-message').textContent = 'Registration failed. Please try again.';
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('login-message').textContent = 'Login successful!';
            // You can store the token in localStorage/sessionStorage if needed
            // localStorage.setItem('token', data.token);
        } else {
            document.getElementById('login-message').textContent = data.message;
        }
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('login-message').textContent = 'Login failed. Please try again.';
    }
});
