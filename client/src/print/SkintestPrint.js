import React from "react";

const SkintestPrint = ({ formData, sum }) => {
  return (
    <div className="print-area">
      <div style={{ width: "80mm", paddingRight: "15px", lineHeight: "130%" }}>
        <div
          style={{
            textAlign: "center",
            fontFamily: "Poppins",
            padding: 0,
            margin: 0,
          }}
        >
          <h1 style={{ fontSize: "25px", fontWeight: "bold", margin: "0px" }}>
            SS GOLD
          </h1>
          <div style={{ margin: 0, padding: 0, fontWeight: "500" }}>
            Computer X-ray Testing
          </div>
          <div style={{ fontWeight: "400", fontSize: "15px" }}>
            59, Main Bazaar, Nilakottai - 624208
          </div>
          <div style={{ fontWeight: "400", fontSize: "15px" }}>
            Ph.No : 8903225544
          </div>
        </div>
        <hr style={{ borderTop: "2px solid black", margin: 0 }} />
        <div
          style={{
            display: "flex",
            justifyContent: "end",
            fontSize: "14px",
            margin: 0,
            fontFamily: "Poppins",
          }}
        >
          <div style={{ paddingRight: "10px" }}>{formData.date}</div>
          <div style={{ paddingRight: "10px" }}>{formData.time}</div>
        </div>
        <hr style={{ borderTop: "2px dashed black", margin: 0 }} />
        <div style={{ fontFamily: "Poppins", fontSize: "15px" }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              Token No<div>:</div>
            </div>
            <div
              style={{
                display: "grid",
                gridColumn: "2/4",
                justifyContent: "center",
              }}
            >
              {formData.tokenNo}
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              Name<div>:</div>
            </div>
            <div
              style={{
                display: "grid",
                gridColumn: "2/4",
                justifyContent: "center",
              }}
            >
              {formData.name}
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              Test<div>:</div>
            </div>
            <div
              style={{
                display: "grid",
                gridColumn: "2/4",
                justifyContent: "center",
              }}
            >
              {formData.test}
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              Weight<div>:</div>
            </div>
            <div
              style={{
                display: "grid",
                gridColumn: "2/4",
                justifyContent: "center",
              }}
            >
              {formData.weight}
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              Sample<div>:</div>
            </div>
            <div
              style={{
                display: "grid",
                gridColumn: "2/4",
                justifyContent: "center",
              }}
            >
              {formData.sample}
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              Amount<div>:</div>
            </div>
            <div
              style={{
                display: "grid",
                gridColumn: "2/4",
                justifyContent: "center",
              }}
            >
              {formData.amount}
            </div>
          </div>
        </div>
        <hr style={{ borderTop: "2px solid black", margin: 0 }} />
        <div style={{ textAlign: "center", fontSize: "14px" }}>
          Thank You.... Visit Again....
        </div>
      </div>
    </div>
  );
};

export default SkintestPrint;
