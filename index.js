const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

let currentContext = {}; // Store the current conversation state for each user (simple implementation)

const predefinedResponses = {
  hello: 'Hello! I am your healthcare assistant. How can I help you today?',
  fever: 'Fever can indicate infection. How long have you had the fever?',
  headache: 'A headache could be due to various factors such as stress or dehydration. On a scale of 1-10, how severe is your headache?',
  prescription_fever: 'For fever, you can take Paracetamol (Tylenol) or Ibuprofen (Advil). Be sure to rest and stay hydrated. If symptoms persist, see a doctor.',
  prescription_headache: 'For headaches, you can take over-the-counter medications like Ibuprofen (Advil) or Acetaminophen (Tylenol). Make sure to relax and stay hydrated.',
  sore_throat: 'Sore throat could be a sign of a viral infection. Drink warm fluids. If it persists, you might need a checkup.',
  appointment: 'I can help you book an appointment. Please provide your preferred date and time.',
  followup_fever: 'Have you noticed any other symptoms such as cough, shortness of breath, or loss of taste?',
  emergency: 'If this is a medical emergency, please call 911 or visit the nearest emergency room.',
  goodbye: 'Goodbye! Take care and stay healthy!',
  thank_you: 'You’re welcome! Is there anything else I can assist you with?',
  confirm_appointment: 'Your appointment is booked for {{time}} on {{date}}. Would you like to add any more details?',
  covid: 'COVID-19 symptoms include fever, cough, and loss of taste or smell. Please get tested if you think you have been exposed.'
};

// Simple in-memory appointment store
let appointments = [];

// Chatbot logic to handle user messages
app.post('/message', (req, res) => {
  const userMessage = req.body.message.toLowerCase();
  let userId = req.body.userId || 'anonymous'; // Track conversation per user

  // Initialize conversation context if not existing
  if (!currentContext[userId]) {
    currentContext[userId] = { context: null, appointment: {} };
  }

  let botReply = 'I’m sorry, I didn’t understand that. Can you elaborate?';

  // Greeting
  if (userMessage.includes('hello')) {
    botReply = predefinedResponses.hello;
    currentContext[userId].context = 'greeting';
  }

  // Symptom Checking and Contextual Responses
  if (userMessage.includes('fever')) {
    botReply = predefinedResponses.fever;
    currentContext[userId].context = 'fever_followup';
  } else if (userMessage.includes('headache')) {
    botReply = predefinedResponses.headache;
    currentContext[userId].context = 'headache_followup';
  } else if (userMessage.includes('sore throat')) {
    botReply = predefinedResponses.sore_throat;
    currentContext[userId].context = 'general';
  } else if (userMessage.includes('covid')) {
    botReply = predefinedResponses.covid;
    currentContext[userId].context = 'covid';
  }

  // Follow-up for symptom severity and suggestions
  if (currentContext[userId].context === 'fever_followup' && userMessage.includes('days')) {
    botReply = predefinedResponses.prescription_fever;
    currentContext[userId].context = 'general';
  } else if (currentContext[userId].context === 'headache_followup' && userMessage.includes('scale')) {
    botReply = predefinedResponses.prescription_headache;
    currentContext[userId].context = 'general';
  }

  // Emergency Handling
  if (userMessage.includes('emergency') || userMessage.includes('heart attack')) {
    botReply = predefinedResponses.emergency;
  }

  // Appointment Scheduling Logic
  if (userMessage.includes('appointment') || userMessage.includes('book')) {
    botReply = predefinedResponses.appointment;
    currentContext[userId].context = 'appointment';
  } else if (currentContext[userId].context === 'appointment' && userMessage.includes('date')) {
    const appointmentDetails = extractAppointmentDetails(userMessage);
    appointments.push(appointmentDetails);
    currentContext[userId].appointment = appointmentDetails;

    botReply = `Your appointment has been scheduled for ${appointmentDetails.date} at ${appointmentDetails.time}. Would you like to provide any additional details?`;
    currentContext[userId].context = 'appointment_confirmation';
  }

  // Farewell
  if (userMessage.includes('goodbye') || userMessage.includes('bye')) {
    botReply = predefinedResponses.goodbye;
    currentContext[userId].context = 'general';
  }

  // Sending chatbot's response
  res.json({ botReply });
});

// Extract appointment details from user input (simple example)
function extractAppointmentDetails(message) {
  // In a real scenario, you’d use more advanced NLP to extract dates and times.
  const timeMatch = message.match(/(?:\bat\s)(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  const dateMatch = message.match(/\b(?:on\s)?(\d{1,2}\w{0,2}\s*\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?)/i);

  return {
    time: timeMatch ? timeMatch[1] : 'not specified',
    date: dateMatch ? dateMatch[1] : 'not specified',
    details: message
  };
}

// Retrieve booked appointments (just for testing)
app.get('/appointments', (req, res) => {
  res.json({ appointments });
});

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
