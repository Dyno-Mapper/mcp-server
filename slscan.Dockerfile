FROM shiftleft/sast-scan:latest

COPY *.json /app/
COPY *.js /app/
COPY /src /app/src

CMD ["scan", "--no-error"]
