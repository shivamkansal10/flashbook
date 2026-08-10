package com.flashbook.util;

import com.flashbook.entity.Booking;
import com.flashbook.entity.Seat;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.stream.Collectors;

public class TicketPdfGenerator {
    public static byte[] generateTicket(Booking booking, byte[] qrCodeImage) throws Exception {
        Document document = new Document(PageSize.A6);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);
        
        document.open();
        
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        
        Paragraph title = new Paragraph("TICKET CONFIRMATION", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        
        document.add(new Paragraph(" ", bodyFont)); // Spacing
        
        document.add(new Paragraph("Event: " + booking.getEvent().getName(), boldFont));
        
        String seatLabels = booking.getSeats() != null
                ? booking.getSeats().stream().map(Seat::getSeatLabel).collect(Collectors.joining(", "))
                : "None";
        document.add(new Paragraph("Seats: " + seatLabels, bodyFont));
        
        BigDecimal totalPrice = booking.getTotalPrice() != null
                ? booking.getTotalPrice()
                : (booking.getSeats() != null
                        ? booking.getSeats().stream().map(Seat::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add)
                        : BigDecimal.ZERO);
        document.add(new Paragraph("Total Price: INR " + totalPrice, bodyFont));
        document.add(new Paragraph("Booking Ref: " + booking.getIdempotencyKey(), bodyFont));
        
        document.add(new Paragraph(" ", bodyFont)); // Spacing
        
        if (qrCodeImage != null) {
            Image img = Image.getInstance(qrCodeImage);
            img.setAlignment(Element.ALIGN_CENTER);
            document.add(img);
        }
        
        document.close();
        return baos.toByteArray();
    }
}
