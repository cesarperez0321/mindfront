    // 1) Pide acceso a la cámara
    const video = document.getElementById('video');

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.error("Error al acceder a la cámara", err);
      });

    // 2) Conexión WebSocket a tu servicio en Cloud Run
    //    Asegúrate de poner aquí TU URL (con wss://):
    const socket = new WebSocket("wss://drowsiness-app-938193306981.us-central1.run.app/ws");

    // Referencia al <img> para mostrar la imagen procesada
    const processedImg = document.getElementById('processedImage');
    // Referencia al botón de reinicio
    const restartButton = document.getElementById('restartButton');

    // 3) Eventos del WebSocket
    socket.onopen = () => {
      console.log('WebSocket conectado');
    };

    socket.onmessage = (event) => {
      // Cuando el servidor envía datos, tratamos de parsearlos
      try {
        const data = JSON.parse(event.data);
        // data.sketch_image -> Imagen procesada en Base64
        if (data.sketch_image) {
          processedImg.src = 'data:image/jpeg;base64,' + data.sketch_image;
        }
      } catch (err) {
        console.error("No se pudo parsear la respuesta como JSON:", err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket cerrado');
      // Mostramos el botón para que el usuario pueda reiniciar
      restartButton.style.display = 'inline-block';
    };

    // 4) Botón para recargar la página y reiniciar el flujo
    restartButton.addEventListener('click', () => {
      // Recarga la página (reinicia todo)
      location.reload();
    });

    // 5) Capturar frames cada 100ms (10 fps) y enviarlos al servidor
    setInterval(() => {
      // Si el socket está abierto, enviamos
      if (socket.readyState === WebSocket.OPEN) {
        // Creamos un canvas temporal para capturar el frame
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        // Tomamos el frame del video y lo dibujamos en el canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Base64 del fotograma
        const base64Image = canvas.toDataURL('image/jpeg').split(';base64,')[1];

        socket.send(base64Image);
      }
    }, 100); // Ajusta a la velocidad deseada
