import loadImage from 'blueimp-load-image';

export const preloadImages = (imagePaths) => {
  return Promise.all(
    imagePaths.map(path => 
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ path, img });
        img.onerror = reject;
        img.src = path;
      })
    )
  );
};

export const convertImageToBase64 = (imagePath) => {
  return new Promise((resolve, reject) => {
    loadImage(
      imagePath,
      (canvas) => {
        resolve(canvas.toDataURL('image/png'));
      },
      {
        maxWidth: 1000,
        maxHeight: 1000,
        canvas: true,
        orientation: true
      }
    );
  });
};

export const generatePrintContent = (tokenData, logoBase64) => {
  const { tokenNo, date, time, name, test, weight, sample, amount } = tokenData;
  
  return `
    <html>
      <head>
        <title>Token Receipt - SS GOLD</title>
        <style>
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          body { 
            font-family: Arial, sans-serif; 
            max-width: 300px; 
            margin: 0 auto; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 1px; 
            border-bottom: 1px solid black; 
            padding-bottom: 1px; 
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo {
            width: 30px;
            height: 30px;
            margin-right: 5px;
            object-fit: contain;
          }
          .header-text {
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .header-title {
            margin: 0;
            font-size: 20px;
            line-height: 1;
            vertical-align: middle;
          }
          .header-subtitle {
            margin: 1px 0;
            font-size: 12px;
          }
          .header-subtitle:nth-child(2) {
            font-size: 14px;
            font-weight: bold;
            margin: 1px 0;
          }
          .content { 
            margin-bottom: 1px;
            border-bottom: 1px dotted black; 
          }
          .row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 3px; 
            font-size: 13px; 
          }
          .row span:first-child { 
            font-weight: medium;
            text-transform: uppercase;
            padding-left: 5px;
          }
          .row span:last-child {
            text-align: center;
            width: 50%;
          }
          .date-time {
            display: flex;
            justify-content: end;
            font-size: 11px;
            margin-bottom: 1px;
            border-bottom: 1px dotted black;
            padding-bottom: 1px;
          }
          .date-time span {
            margin-right: 5px;
          }
          .thank-you {
            text-align: center;
            font-size: 12px;
            margin: 1px 0;
            font-style: italic;
            font-family: 'Vivaldi', cursive;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-text">
            <div class="logo-container">
              ${logoBase64 ? `<img src="${logoBase64}" alt="SS GOLD Logo" class="logo" />` : ''}
              <h1 class="header-title">SS GOLD</h1>
            </div>
            <p class="header-subtitle">Computer X-ray Testing</p>
            <p class="header-subtitle">59, Main Bazaar, Nilakottai - 624208</p>
            <p class="header-subtitle">Ph.No: 8903225544</p>
          </div>        
        </div>
        <div class="date-time">
          <span>${date}</span>
          <span>${time}</span>
        </div>
        <div class="content">
          <div class="row">
            <span>Token No</span>
            <span>${tokenNo}</span>
          </div>
          <div class="row">
            <span>Name</span>
            <span>${name}</span>
          </div>
          <div class="row">
            <span>Test</span>
            <span>${test}</span>
          </div>
          <div class="row">
            <span>Weight</span>
            <span>${parseFloat(weight).toFixed(3)} g</span>
          </div>
          <div class="row">
            <span>Sample</span>
            <span>${sample}</span>
          </div>
          <div class="row">
            <span>Amount</span>
            <span>₹${amount}</span>
          </div>
        </div>
        <div class="thank-you">
          Thank You.... Visit Again....
        </div>
      </body>
    </html>
  `;
};
