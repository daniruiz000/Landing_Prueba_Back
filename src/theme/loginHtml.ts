export const loginPageStyles = `
<title>Inicio de Sesión</title>
<style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 310px;
      margin: 100px auto;
      background: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #333;
    }
    label {
      display: block;
      margin-top: 10px;
    }
    input {
      width: 50%;
      padding: 10px;
      margin: 5px 0;
      border: 1px solid #ccc;
      border-radius: 5px;
      text-align: center;
    }
    button {
      display: block;
      width: 50%;
      padding: 10px;
      margin: 20px auto;
      background-color: #007BFF;
      color: #fff;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    button:hover {
      background-color: #0056b3;
    }
    .error-message {
      color: red;
      display: none;
      margin-top: 10px;
    }
    .generate-excel-button {
      margin-top: 10px;
    }
    .welcome-message {
      color: green;
      display: none;
      margin-top: 10px;
    }
    .logout-button {
      background-color: #FF5733;
      color: #fff;
      display: none;
    }
    .login-text {
      max-width: 80%;
      margin: 20px auto;
    }
  </style>
`;

export const loginPageContent = `
<div class="container">
    <h1>Login</h1>
    <p class="login-text">Ingresa tus credenciales para iniciar sesión:</p>
    <form id="loginForm" action="/do-login" method="post">
      <label for="email" id="email_label">Email:</label>
      <input type="email" id="email" name="email" required><br>

      <label for="password" id="password_label">Contraseña:</label>
      <input type="password" id="password" name="password" required><br>

      <button type="submit" id="loginButton">Iniciar Sesión</button>
    </form>
    <div id="error-message" class="error-message">Credenciales incorrectas. Por favor, inténtalo de nuevo.</div>
    <div id="welcomeMessage" class="welcome-message"></div>
    <button id="generateExcelButton" class="generate-excel-button" style="display: none">Generar Excel</button>
    <button id="logoutButton" class="logout-button" style="display: none">Cerrar Sesión</button>
  </div>
`;

export const loginPageScripts = `
<script>
    const loginForm = document.getElementById("loginForm");
    const generateExcelButton = document.getElementById("generateExcelButton");
    const errorMessage = document.getElementById("error-message");
    const welcomeMessage = document.getElementById("welcomeMessage");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const emailLabel = document.getElementById("email_label");
    const passwordLabel = document.getElementById("password_label");
    const loginText = document.querySelector(".login-text");
    const logoutButton = document.getElementById("logoutButton");

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = emailInput.value;
      const password = passwordInput.value;
      try {
        const response = await fetch("/do-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
        if (response.status === 200) {
          const data = await response.json();
          const token = data.token;
          localStorage.setItem("token", token);
          // Ocultar los elementos relacionados con el inicio de sesión
          loginForm.style.display = "none";
          loginText.style.display = "none";
          errorMessage.style.display = "none"; // Ocultar el mensaje de error si estaba visible
          // Mostrar el mensaje de bienvenida y los botones
          welcomeMessage.style.display = "block";
          welcomeMessage.textContent = "¡Bienvenido " + email;
          logoutButton.style.display = "block";
          generateExcelButton.style.display = "block";
          // Limpiar campos de entrada de texto
          emailInput.value = "";
          passwordInput.value = "";
        } else {
          // Las credenciales son incorrectas, muestra un mensaje de error
          errorMessage.style.display = "block";
          generateExcelButton.style.display = "none"; // Ocultar el botón si las credenciales son incorrectas
          // Limpiar campos de entrada de texto
          emailInput.value = "";
          passwordInput.value = "";
        }
      } catch (error) {
        console.error("Error al iniciar sesión:", error);
      }
    });

    // Botón para descargar automáticamente el archivo Excel
    generateExcelButton.addEventListener("click", async () => {
      // Recupera el token del almacenamiento local
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token no encontrado. Asegúrate de iniciar sesión primero.");
        return;
      }

      // Realiza la llamada a /user/generate-excel pasando el token
      try {
        const response = await fetch("/get-xlsx-database", {
          method: "GET",
          headers: {
            "Authorization": "Bearer " + token, // Envía el token en la cabecera
          },
        });

        if (response.status === 200) {
          // Obtén el nombre del archivo del encabezado Content-Disposition
          const contentDisposition = response.headers.get("Content-Disposition");
          const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);

          if (filenameMatch && filenameMatch[1]) {
            const filename = filenameMatch[1];
            // Convierte la respuesta en un blob
            const blob = await response.blob();

            // Crea una URL del objeto blob
            const url = window.URL.createObjectURL(blob);

            // Crea un elemento de enlace para descargar el archivo
            const a = document.createElement("a");
            a.href = url;
            a.download = filename; // Utiliza el nombre original del archivo
            a.style.display = "none";

            // Simula un clic en el enlace para descargar el archivo
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Limpia la URL
            window.URL.revokeObjectURL(url);
          } else {
            console.error("No se encontró el nombre del archivo en el encabezado Content-Disposition.");
          }
        } else {
          console.error("Error al generar el archivo Excel. Código de estado:", response.status);
        }
      } catch (error) {
        console.error("Error al generar el archivo Excel:", error);
      }
    });

    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("token"); // Eliminar el token del almacenamiento local
      loginForm.style.display = "block";
      loginText.style.display = "block";
      welcomeMessage.style.display = "none";
      generateExcelButton.style.display = "none";
      logoutButton.style.display = "none";
    });
  </script>
`;
