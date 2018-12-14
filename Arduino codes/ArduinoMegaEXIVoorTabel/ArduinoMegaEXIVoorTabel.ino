#include <ArduinoJson.h>
#include <math.h>

const int plateConn[4][8] = { 
  {22, 23, 24, 25, 26, 27, 7, 2},
  {30, 31, 32, 33, 34, 35, 36, 12},
  {13, 39, 40, 41, 8, 43, 44, 45},
  {46, 47, 48, 49, 50, 51, 52, 53}
 };
int buttonStates[4][8] = { 
  {0, 0, 0, 0, 0, 0, 0, 0},
  {0, 0, 0, 0, 0, 0, 0, 0},
  {0, 0, 0, 0, 0, 0, 0, 0},
  {0, 0, 0, 0, 0, 0, 0, 0}
};
bool changed = false;

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 8; j++) {
      pinMode(plateConn[i][j], INPUT_PULLUP);
    }
  }
}

void loop() {
  DynamicJsonDocument doc;
  JsonObject obj = doc.to<JsonObject>();
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 8; j++) {
      int readValueStart = digitalRead(plateConn[i][j]);
      int readValueConverted = 0;
      if (readValueStart == 1) {
        readValueConverted = 0;
      } else if (readValueStart == 0) {
        readValueConverted = 1;
      }
      if (buttonStates[i][j] != readValueConverted) {
        buttonStates[i][j] = readValueConverted;
        
        obj[String(i) + ":" + String(j)] = readValueConverted;
        changed = true;
      }
    }
  }

  if (changed) {
    serializeJson(doc, Serial);
    Serial.println();
    changed = false;
  }
  delay(500);
}
