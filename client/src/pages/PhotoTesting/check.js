<div className="bg-white border-2 border-yellow-400 shadow-2xl relative" style={{ width: '6in', height: '4in' }}>
        {/* Header Section */}
        <div className="p-0 m-0">
          <div className="flex items-start h-[65px]">
            <div className="w-[95px] h-[95px] flex-shrink-0 -mt-3">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="pt-2 -ml-2">
              <h1 
                className="text-[48px] font-bold leading-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(214, 164, 6, 1) 0%, rgba(255, 215, 0, 1) 50%, rgba(214, 164, 6, 1) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                SS GOLD
              </h1>
              <h2 className="text-[14px] font-bold text-red-600 -mt-1 text-right">Computer X-ray Testing</h2>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-2 py-1 flex gap-2">
          {/* Left Side - Form */}
          <div className="flex-1 space-y-2">
            {/* Address and Phone */}
            <div className="text-green-600 font-medium text-xs pt-2">
              <p>59, Main Bazaar, Nilakottai - 624 208</p>
              <p>Ph.No - 8903225544</p>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center">
                <span className="text-blue-700 font-medium w-16">Token No</span>
                <span className="mx-2">:</span>
                <span className="text-blue-700 font-medium">{formData.tokenNo || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-700 font-medium w-12">Date</span>
                <span className="mx-2">:</span>
                <span className="text-blue-700 font-medium">
                  {formData.date ? new Date(formData.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  }).replace(/\//g, '-') : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center text-xs">
              <span className="text-blue-700 font-medium w-16">Name</span>
              <span className="mx-2">:</span>
              <span className="text-blue-700 font-medium">{formData.name || 'N/A'}</span>
            </div>

            <div className="flex items-center text-xs">
              <span className="text-blue-700 font-medium w-16">Sample</span>
              <span className="mx-2">:</span>
              <span className="text-blue-700 font-medium">{formData.sample || 'N/A'}</span>
            </div>

            <div className="flex items-center text-xs">
              <span className="text-blue-700 font-medium w-16">weight</span>
              <span className="mx-2">:</span>
              <span className="text-blue-700 font-medium">{formData.weight != null ? parseFloat(formData.weight).toFixed(3) : '-'}</span>
            </div>

            {/* Results Table */}
            <div className="mt-3">
              <table className="border-2 border-yellow-500 w-[264px]">
                <thead>
                  <tr>
                    <th className="bg-green-500 text-yellow-300 text-lg font-bold p-1.5 border border-yellow-500 w-20">
                      GOLD %
                    </th>
                    <th className="bg-green-500 text-yellow-300 text-lg font-bold p-1.5 border border-yellow-500 w-20">
                      KARAT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="bg-green-500 text-yellow-300 text-lg font-bold p-1.5 border border-yellow-500 text-center">
                      {formData.goldFineness || '0.00'}
                    </td>
                    <td className="bg-green-500 text-yellow-300 text-lg font-bold p-1.5 border border-yellow-500 text-center">
                      {formData.karat || '0.00'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Additional Test Results */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="text-blue-700 font-medium w-12">Silver</span>
                  <span className="mx-2">:</span>
                  <span className="text-blue-700 font-medium">{formData.silver != null ? formData.silver : '-'}</span>
                </div>
                <div></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="text-blue-700 font-medium w-12">Copper</span>
                  <span className="mx-2">:</span>
                  <span className="text-blue-700 font-medium">{formData.copper != null ? formData.copper : '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-700 font-medium w-16">Cadmium</span>
                  <span className="mx-2">:</span>
                  <span className="text-blue-700 font-medium">{formData.cadmium != null ? formData.cadmium : '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="text-blue-700 font-medium w-12">Zinc</span>
                  <span className="mx-2">:</span>
                  <span className="text-blue-700 font-medium">{formData.zinc != null ? formData.zinc : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 font-medium w-12">Remark</span>
                  <span className="ml-4">:</span>
                  <span className="text-red-600 font-bold">{formData.remarks || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Photo Upload Area */}
          <div className="w-[275px] relative group">
                <div className="text-center p-8">
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700 mb-1">photo upload area</p>
                  <p className="text-xs text-gray-500">Click or drag image</p>
                </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <div className="px-3 pb-2">
                 <p className="text-center text-red-600 font-medium text-xs">
                    Result are only for skin of the sample.
                 </p>
            </div>
    </div>
</div>

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
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: 'Poppins', sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .photo-printarea {
            width: 5.72in;
            height: 4in;
            background: #fff;
            margin: 15px 15px 15px 15px;
          }
          .printarea {
            border: 1.8px solid #FFD700;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          .header {
            display: flex;
            align-items: flex-start;
            height: 65px;
            padding: 0;
            margin: 0;
          }
          .header img {
            width: 85px;
            height: 85px;
            margin-top: -12px;
            object-fit: contain;
            position: relative;
          }
          .header h1 {
            font-size: 45px;
            font-weight: bold;
            line-height: 1;
            margin: 0;
            padding-left: 8px;
            background: linear-gradient(90deg, rgba(214,164,6,1) 0%, rgba(255,215,0,1) 50%, rgba(214,164,6,1) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
          }
          .header h2 {
            font-size: 14px;
            font-weight: bold;
            color: #dc2626;
            margin: -4px 0 0;
            text-align: right;
          }
          .content {
            flex: 1;
            display: flex;
            gap: 10px;
            padding: 4px 8px;
          }
          .left {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 3.7px;
            width: 265px;
          }
          .address {
            font-size: 11px;
            font-weight: 500;
            color: #16a34a;
            margin: 0;
          }
          .address p {
            margin: 0;
          }
          .form-fields {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          }
          .form-fields .f-field {
            display: flex;
            align-items: center;
            margin: 0;
          }
          .form-fields .f-field span {
              font-size: 11px;
              font-weight: 500;
              color: #0000FF;
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
            font-weight: 500;
            color: #0000FF;
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
            background: #22c55e;
            color: #FFD700;
            font-size: 16px;
            font-weight: bold;
            padding: 6px;
            border: 1px solid #FFD700;
            text-align: center;
          }
          .results-table td {
            background: #22c55e;
            color: #FFD700;
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
            padding-top: 6px;
          }
          .remark {
            color: #dc2626;
            font-weight: bold;
          }
          .right {
            width: 260px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .right img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            position: relative;
          }
          .placeholder {
            text-align: center;
            font-size: 11px;
          }
          .footer {
            margin-top: auto;
            font-size: 10px;
            color: #dc2626;
            text-align: center;
            font-weight: 500;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="photo-printarea">
          <!-- Header -->
          <div class="printarea">
            <div class="header">
            <img src="${logoUrl}" alt="Logo" />
            <div style="padding-top:8px;margin-left:-8px;">
              <h1>SS GOLD</h1>
              <h2>Computer X-ray Testing</h2>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Left -->
            <div class="left">
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

            <!-- Right -->
            <div class="right">
              <div class="photo">
                ${formData.photoUrl ? `<img src="${formData.photoUrl}" alt="Uploaded Photo" />` : `<div class="placeholder">No photo available</div>`}
              </div>
              <div class="footer">Result are only for skin of the sample.</div>
            </div>
          </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            const img = document.querySelector('.right img');
            if (img) {
              img.onload = () => setTimeout(() => { window.print(); window.close(); }, 300);
              img.onerror = () => setTimeout(() => { window.print(); window.close(); }, 300);
            } else {
              setTimeout(() => { window.print(); window.close(); }, 300);
            }
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();


};
