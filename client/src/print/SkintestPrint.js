import React from "react";
import Logo from "../asset/logo.png";

const SkintestPrint = ({ formData, sum }) => {
  return (
    <div className="print-area">
     <div style={{ width: "210mm", backgroundColor: "white", height: "99mm" }}>
      <div
        style={{
          textAlign: "center",
          fontFamily: "Poppins",
          padding: 0,
          margin: 0,
          height: "27mm",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={Logo} alt="logo" style={{ height: "20mm" }} />
          <h1
            style={{
              fontSize: "55px",
              fontWeight: "bold",
              margin: "0px",
              background:
                "linear-gradient(90deg, rgba(224,170,62,1) 0%, rgba(255,215,0,1) 67%, rgba(224,170,62,1) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SS GOLD
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            flexFlow: "column",
            alignItems: "start",
          }}
        >
          <div
            style={{
              margin: 0,
              padding: 0,
              fontWeight: "700",
              fontSize: 22,
              color: "red",
            }}
          >
            Computer X-ray Testing
          </div>
          <div
            style={{ fontWeight: "600", fontSize: "13px", color: "lightgreen" }}
          >
            59, Main Bazaar, Nilakottai - 624208
          </div>
          <div
            style={{ fontWeight: "600", fontSize: "13px", color: "lightgreen" }}
          >
            Ph.No : 8903225544
          </div>
        </div>
      </div>
      <hr style={{ borderTop: "3px solid #D3B04D", margin: 0 }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10,1fr)",
          gridTemplateRows: "repeat(3,1fr)",
          margin: 0,
          fontFamily: "Poppins",
          color: "black",
          fontWeight: "500",
        }}
      >
        <div style={{ gridColumn: "1/3" }}>Token No :</div>
        <div style={{ gridColumn: "3/6" }}>token</div>
        <div style={{ gridColumn: "6/8" }}>Date :</div>
        <div style={{ gridColumn: "8/11" }}>Date</div>
        <div style={{ gridColumn: "1/3" }}>Name :</div>
        <div style={{ gridColumn: "3/6" }}>name</div>
        <div style={{ gridColumn: "6/8" }}>Time :</div>
        <div style={{ gridColumn: "8/11" }}>time</div>
        <div style={{ gridColumn: "1/3" }}>Sample :</div>
        <div style={{ gridColumn: "3/6" }}>sample</div>
        <div style={{ gridColumn: "6/8" }}>Weight :</div>
        <div style={{ gridColumn: "8/11" }}>weight</div>
      </div>
      <hr style={{ borderTop: "3px solid #D3B04D", margin: 0 }} />
      <div
        style={{
          margin: 0,
          height: "10mm",
          background: "red",
          display: "grid",
          gridTemplateColumns: "repeat(10,1fr)",
          alignContent: "center",
          color: "#FFD700",
          fontWeight: "bolder",
        }}
      >
        <div style={{ gridColumn: "1/4" }}>GOLD FINENESS %</div>
        <div style={{ gridColumn: "4/6" }}>gold</div>
        <div style={{ gridColumn: "6/8" }}>KARACT Ct</div>
        <div style={{ gridColumn: "8" }}>karat K</div>
      </div>
      <hr style={{ borderTop: "3px solid #D3B04D", margin: 0 }} />
      <div
        style={{
          margin: 0,
          display: "grid",
          gridTemplateColumns: "repeat(10,1fr)",
          gridTemplateRows: "repeat(5,1fr)",
          fontStyle: "normal",
          height: "29mm",
          fontSize: "14px",
          color: "black",
          fontWeight: "500",
        }}
      >
        <div style={{ gridColumn: "1/3" }}>Silver :</div>
        <div style={{ gridColumn: "3" }}>01</div>
        <div>Nickel :</div>
        <div>02</div>
        <div>Osmium :</div>
        <div>03</div>
        <div>Titanium :</div>
        <div>04</div>
        <div style={{ gridColumn: "1/3" }}>Copper :</div>
        <div>05</div>
        <div>Tungsten :</div>
        <div>06</div>
        <div>Rhodium :</div>
        <div>07</div>
        <div>Palladium :</div>
        <div>08</div>
        <div style={{ gridColumn: "1/3" }}>Zinc</div>
        <div>09</div>
        <div>Irudium</div>
        <div>10</div>
        <div>Rhenium</div>
        <div>11</div>
        <div>Platinum</div>
        <div>12</div>
        <div style={{ gridColumn: "1/3" }}>Cadmium</div>
        <div>13</div>
        <div>Ruthenium</div>
        <div>14</div>
        <div>Indium</div>
        <div>15</div>
        <div>Others</div>
        <div>16</div>
        <div style={{ gridColumn: "1/3" }}>REMARKS</div>
        <div>17</div>
        <div style={{ gridColumn: "5/8" }}>Authorized By</div>
        <div>18</div>
      </div>
      <hr style={{ borderTop: "3px solid #D3B04D", margin: 0 }} />
      <div
        style={{
          textAlign: "center",
          fontSize: "14px",
          color: "black",
          fontWeight: "500",
        }}
      >
        Thank You.... Visit Again....
      </div>
    </div>
    </div>
  );
};

export default SkintestPrint;
