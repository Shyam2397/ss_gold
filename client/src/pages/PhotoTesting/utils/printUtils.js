import logo from '../../../assets/logo.png';

export const printPhotoData = (formData) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
  const logoUrl = `${window.location.origin}${logo.startsWith('/') ? logo : '/' + logo}`;

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>SS GOLD - Print</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Allura&display=swap" rel="stylesheet">
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Allura&display=swap');
          @page {
            size: 6in 4in landscape;
            margin: 0;
            padding: 0;
          }
          body {
            width: 6in;
            height: 4in;
            margin: 0;
            padding: 12.4px;
            background: white;
            font-family: 'Poppins', sans-serif;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .photo-printarea {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: inset 0 0 0 1.4px #FFD700;
            box-sizing: border-box;
            padding: 7px;
          }
          .photo-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
          }
          .left-wrapper {
            width: 50%;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .header {
            display: flex;
            flex-direction: row;
            align-items: center;
            height: 65px;
            padding: 0;
            margin: 0;
          }
          .header img {
            width: 80px;
            height: 80px;
            object-fit: contain;
            margin-top: -10px;
            margin-left: -10px;
          }
          .header h1 {
            font-size: 42px;
            font-weight: bold;
            margin-left: 8px;
            margin:0;
            margin-top: -5px;
            background: linear-gradient(90deg, rgba(214,164,6,1) 0%, rgba(255,215,0,1) 50%, rgba(214,164,6,1) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
          }
          .header h2 {
            font-size: 15px;
            font-weight: bold;
            color: #dc2626;
            margin: -15px 0 0;
            text-align: right;
          }
          .address {
            font-size: 11px;
            font-weight: 500;
            color: #00B050;
            margin: 0;
          }
          .address p {
            margin: 0;
          }

          .form-fields {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            padding-top: 6px;
          }
          .form-fields .f-field {
            display: flex;
            align-items: center;
            margin: 0;
          }
          .form-fields .f-field span {
              font-size: 11px;
              font-weight: 600;
              color: #1D6194;
              width: 60px;
              margin:0;
          }
          .f-field span:nth-child(2) {
              width: 2px;
              margin-left:5px;
              padding-right:8px;
          }

          .field{
            display: flex;
            align-items: center;
            margin: 0;
            font-size: 11px;
            font-weight: 600;
            color: #1D6194;
            padding-top: 6px;
          }
          .field span{
            width: 60px;
          }
          .field span:nth-child(2) {
            width:2px ;
            margin-left:5px;
            padding-right:8px;
          }
          .field span:nth-child(3) {
            width: auto;
          }

          .results-table {
            margin-top: 2px;
            border: 2px solid #FFD700;
            border-collapse: collapse;
            width: 264px;
          }
          .results-table th {
            background: #00B050;
            color: #FFFF00;
            font-size: 16px;
            font-weight: bold;
            padding: 6px;
            border: 1px solid #FFD700;
            text-align: center;
          }
          .results-table td {
            background: #00B050;
            color: #FFFF00;
            font-size: 16px;
            font-weight: bold;
            padding: 6px;
            border: 1px solid #FFD700;
            text-align: center;
          }
          
          .additional-results{
            margin-top : 2px; 
          }
          .additional-columns{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            padding-top: 2px;
          }
          .remark {
            color: #dc2626;
            font-weight: bold;
          }
          .right-wrapper {
            width: 50%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding: 5px;
            box-sizing: border-box;
          }
          .right-wrapper img {
            flex-grow: 1;
            max-width: 100%;
            object-fit: cover;
            max-height: 100%;
          }

          .footer {
            color: #dc2626;
            font-weight: 500;
            font-size: 10px;
            text-align: center;
            margin-top: auto;
          }
        </style>
      </head>
      <body>
        <div class="photo-printarea">
            <div class="photo-wrapper">
              <div class="left-wrapper">
                <div class="header">
                  <img src="${logoUrl}" alt="Logo" />
                  <div>
                    <h1>SS GOLD</h1>
                    <h2>Computer X-ray Testing</h2>
                  </div>
                </div>

                <div class="address">
                  <p>59, Main Bazaar, Nilakottai - 624 208</p>
                  <p>Ph.No - 8903225544</p>
                </div>

                <div class="form-fields">
                  <div class="f-field"><span>Token No</span> <span> : </span> <span>${formData.tokenNo || 'N/A'}</span></div>
                  <div class="f-field"><span>Date</span> <span> : </span> <span>${formData.date ? new Date(formData.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  }).replace(/\//g, '-') : 'N/A'}</span></div>
                </div>
                <div class="field"><span>Name</span> <span> : </span> <span>${formData.name || 'N/A'}</span></div>
                <div class="field"><span>Sample</span> <span> : </span> <span>${formData.sample || 'N/A'}</span></div>
                <div class="field"><span>Weight</span> <span> : </span> <span>${formData.weight != null ? parseFloat(formData.weight).toFixed(3) : '-'}</span></div>

                <table class="results-table">
                <thead>
                  <tr><th>GOLD %</th><th>KARAT</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${formData.goldFineness || '0.00'}</td>
                    <td>${formData.karat || '0.00'}</td>
                  </tr>
                </tbody>
              </table>

              <div class="additional-result">
                <div class="additional-columns">
                  <div class="field"><span>Silver</span> <span> : </span> <span>${formData.silver || '-'}</span></div>
                  <div></div>
                </div>
                <div class="additional-columns">
                  <div class="field"><span>Copper</span> <span> : </span> <span>${formData.copper || '-'}</span></div>
                  <div class="field"><span>Cadmium</span> <span> : </span> <span>${formData.cadmium || '-'}</span></div>
                </div>
                <div class="additional-columns">
                  <div class="field"><span>Zinc</span> <span> : </span> <span>${formData.zinc || '-'}</span></div>
                  <div class="field"><span>Remark</span> <span> : </span> <span class="remark">${formData.remarks || '-'}</span></div>
                </div>
              </div>

              </div>

              <div class="right-wrapper">
                ${formData.photoUrl ? `
                  <div style="
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    background-color: white;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  ">
                    <img 
                      src="${formData.photoUrl}" 
                      alt="Uploaded Photo" 
                      style="
                        max-width: 100%;
                        max-height: 100%;
                        width: auto;
                        height: auto;
                        object-fit: contain;
                        image-rendering: -webkit-optimize-contrast;
                        image-rendering: crisp-edges;
                        image-rendering: high-quality;
                        image-rendering: pixelated;
                        -ms-interpolation-mode: bicubic;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        background-color: white;
                        filter: contrast(1.1) saturate(1.1);
                      "
                      onload="this.style.opacity=1"
                      style="opacity: 0; transition: opacity 0.3s ease-in-out;"
                    />
                  </div>
                ` : `<div class="placeholder">No photo available</div>`}
                <div class="footer">Result are only for skin of the sample.</div>
              </div>
            </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();

};
