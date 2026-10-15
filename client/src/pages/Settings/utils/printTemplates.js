export const buildTokenTestHtml = () => `
        <html><head><style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; padding: 8px; font-size: 12px; }
          .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 4px; }
          .header h1 { font-size: 18px; margin: 0; }
          .row { display: flex; justify-content: space-between; padding: 2px 0; }
          .footer { text-align: center; margin-top: 4px; font-style: italic; }
        </style></head><body>
          <div class="header"><h1>SS GOLD</h1><p>Test Token Receipt</p></div>
          <div class="row"><span>Token No</span><span>T001</span></div>
          <div class="row"><span>Name</span><span>Test Customer</span></div>
          <div class="row"><span>Test</span><span>Skin Testing</span></div>
          <div class="row"><span>Weight</span><span>10.000 g</span></div>
          <div class="row"><span>Sample</span><span>Ring</span></div>
          <div class="row"><span>Amount</span><span>₹100</span></div>
          <div class="footer">--- Test Print Successful ---</div>
        </body></html>`;

export const buildSkinTestTestHtml = () => `
      <html><head><style>
        @page { size: A4 portrait; margin: 0; }
        body { font-family: Arial, sans-serif; width: 210mm; padding: 10mm; box-sizing: border-box; font-size: 11pt; color: #111; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FFD700; padding-bottom: 6px; margin-bottom: 8px; }
        .logo { font-size: 28pt; font-weight: bold; color: #c09823; }
        .company { text-align: right; font-size: 9pt; color: #333; }
        .bar { background: #32CD32; color: yellow; font-size: 13pt; font-weight: bold; display: flex; justify-content: space-around; padding: 6px 0; border-radius: 3px; margin: 8px 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 9.5pt; margin-bottom: 8px; }
        .footer { text-align: center; font-style: italic; margin-top: 8px; border-top: 2px solid #FFD700; padding-top: 4px; color: #555; }
      </style></head><body>
        <div class="header">
          <div class="logo">SS GOLD</div>
          <div class="company"><strong style="color:#e00;font-size:13pt">Computer X-ray Testing</strong><br/>59, Main Bazaar, Nilakottai - 624 208<br/>Ph.No : 8903225544</div>
        </div>
        <div class="grid">
          <div><b>Token No</b> : T001</div><div><b>Date</b> : 01/01/2025</div>
          <div><b>Name</b> : Test Customer</div><div><b>Time</b> : 10:00 AM</div>
          <div><b>Sample</b> : Ring</div><div><b>Weight</b> : 10.000 g</div>
        </div>
        <div class="bar">
          <span>GOLD FINENESS %</span><span>91.60 %</span>
          <span>KARAT Ct</span><span>21.98 K</span>
        </div>
        <div class="grid">
          <div>Gold : -</div><div>Nickel : -</div>
          <div>Copper : 5.20</div><div>Silver : 2.80</div>
          <div>Zinc : 0.40</div><div>Others : -</div>
        </div>
        <div class="footer">Thank You .... Visit Again....</div>
      </body></html>`;
