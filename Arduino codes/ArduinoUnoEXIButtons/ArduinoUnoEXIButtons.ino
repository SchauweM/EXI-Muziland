#include <ArduinoJson.h>

const int buttonPin[5] = { 2, 4, 7, 8, 12 };
int buttonStates[5] = { 0 };
const int ledStart = 3;
const int ledButtons[4] = { 5, 6, 9, 10 };
bool changed = false;

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 5; i++) {
    pinMode(buttonPin[i], INPUT_PULLUP);
  }
  for (int i = 0; i < 4; i++) {
    pinMode(ledButtons[i], OUTPUT);
  }
  pinMode(ledStart, OUTPUT);
}

void loop() {
  digitalWrite(ledStart, HIGH);
  for (int i = 0; i < 4; i++) {
    digitalWrite(ledButtons[i], HIGH);
  }
  DynamicJsonDocument doc;
  JsonObject obj = doc.to<JsonObject>();
  for (int i = 0; i < 5; i++) {
    int readValueStart = digitalRead(buttonPin[i]);
    int readValueConverted = 0;
    if (readValueStart == 1) {
        readValueConverted = 0;
      } else if (readValueStart == 0) {
        readValueConverted = 1;
      }
      if (readValueConverted != buttonStates[i]) {
        if (readValueConverted != 0) {
          obj["button-" + String(i)] = readValueConverted;
          changed = true;
          buttonStates[i] = readValueConverted;
        }
        if (readValueConverted == 0) {
          buttonStates[i] = readValueConverted;
        }
      }
  }

  if (changed) {
    serializeJson(doc, Serial);
    Serial.println();
    changed = false;
  }
  delay(100);
}
